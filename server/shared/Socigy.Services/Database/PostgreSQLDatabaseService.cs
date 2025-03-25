using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using NpgsqlTypes;
using Socigy.Services.Database.Enums;
using Socigy.Structures.Database;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.ComponentModel;
using System.Data;
using System.Data.Common;
using System.Data.SqlTypes;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Reflection.Metadata;
using System.Runtime;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

namespace Socigy.Services.Database
{
    internal class PostgreSQLDatabaseService : BaseService, IDatabaseService
    {
        private readonly ImmutableDictionary<string, string> _TableMapping;
        private readonly string _ConnectionString;
        private NpgsqlConnection _Connection => new NpgsqlConnection(_ConnectionString);
        private readonly IJsonTypeInfoResolver _JsonResolver;
        private readonly JsonSerializerOptions _JsonOptions = new(JsonSerializerDefaults.General)
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };

        public PostgreSQLDatabaseService(ILogger<PostgreSQLDatabaseService> logger, IConfiguration configuration, IJsonTypeInfoResolver resolver) : base(logger)
        {
            string? dbHost = configuration.GetValue<string>("DB_HOST");
            string? dbPort = configuration.GetValue<string>("DB_PORT");

            string? dbName = configuration.GetValue<string>("DB_NAME");
            string? dbUser = configuration.GetValue<string>("DB_USER");
            string? dbPassword = configuration.GetValue<string>("DB_PASSWORD");

            string? connectionString = configuration.GetConnectionString("Default");
            if (connectionString == null)
            {
                Critical("DB Connection string with name \"Default\" is not defined. Cannot connect to DB");
                throw new NpgsqlException("DB Connection string with name \"Default\" is not defined. Cannot connect to DB");
            }
            else if (string.IsNullOrEmpty(dbHost) || string.IsNullOrEmpty(dbPort) || string.IsNullOrEmpty(dbName) || string.IsNullOrEmpty(dbUser) || string.IsNullOrEmpty(dbPassword))
            {
                Critical("DB Connection environment variables are missing");
                throw new NpgsqlException("DB Connection environment variables are missing");
            }

            Info($"Starting {nameof(IDatabaseService)} with PostgreSQL implementation. DB Host: {dbHost}");
            _JsonResolver = resolver;

            _TableMapping = configuration.GetRequiredSection("DatabaseMapping").GetChildren().ToImmutableDictionary(x => x.Key, x => x.Value!);

            _ConnectionString = connectionString
                .Replace("DB_HOST", dbHost)
                .Replace("DB_PORT", dbPort)
                .Replace("DB_USER", dbUser)
                .Replace("DB_PASSWORD", dbPassword)
                .Replace("DB_NAME", dbName);
        }

        #region Base
        public async Task<(IDbConnection, DbDataReader)> ExecuteAdvancedQueryAsync(string query, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters)
        {
            // TODO: Handle sensitive data logging
            // Debug($"Executing asynchronous query ({behaviour}): \n{query}\nWith parameters: {string.Join(',', parameters)}");
            var connection = _Connection;
            await connection.OpenAsync();

            using var command = new NpgsqlCommand(query, connection, transaction as NpgsqlTransaction);
            command.Parameters.AddRange((from param in parameters
                                         select new NpgsqlParameter(param.Id, param.Value ?? DBNull.Value)).ToArray());

            return (connection, await command.ExecuteReaderAsync(behaviour));
        }
        public Task<(IDbConnection, DbDataReader)> ExecuteQueryAsync(string query, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters) =>
            ExecuteAdvancedQueryAsync(query, CommandBehavior.Default, transaction, parameters);

        public async Task<(IDbConnection, DbDataReader)> ExecuteAdvancedQueryNullableAsync(string query, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters)
        {
            // TODO: Handle sensitive data logging
            // Debug($"Executing asynchronous query ({behaviour}): \n{query}\nWith parameters: {string.Join(',', parameters)}");
            var connection = _Connection;
            await connection.OpenAsync();

            using var command = new NpgsqlCommand(query, connection, transaction as NpgsqlTransaction);
            command.Parameters.AddRange(parameters.Select(x =>
            {
                var param = new NpgsqlParameter(x.Name, x.Type)
                {
                    Value = x.Value ?? DBNull.Value
                };
                return param;
            }).ToArray());

            return (connection, await command.ExecuteReaderAsync(behaviour));
        }
        public Task<(IDbConnection, DbDataReader)> ExecuteQueryNullableAsync(string query, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters) =>
            ExecuteAdvancedQueryNullableAsync(query, CommandBehavior.Default, transaction, parameters);


        public async Task<IEnumerable<T>> ExecuteQueryAsync<T>(string query, Func<DbDataReader, T> transformationFunc, params (string Id, object Value)[] parameters)
        {
            var result = await ExecuteQueryAsync(query, null, parameters);
            using var connection = result.Item1;
            using var reader = result.Item2;

            List<T> results = [];
            while (await reader.ReadAsync())
                results.Add(transformationFunc(reader));

            return results;
        }

        public async Task<T?> GetSingleValue<T>(string query, Func<DbDataReader, T> transformationFunc, params (string Id, object Value)[] parameters)
        {
            return await GetSingleValue<T>(query, transformationFunc, null, parameters);
        }
        public async Task<T?> GetSingleValue<T>(string query, Func<DbDataReader, T> transformationFunc, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters)
        {
            var result = await ExecuteQueryAsync(query, transaction, parameters);
            using var connection = result.Item1;
            using var reader = result.Item2;

            if (await reader.ReadAsync())
                return transformationFunc(reader);
            else
                return default;
        }

        public async Task<int> ExecuteAdvancedNonQueryAsync(string stringCommand, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters)
        {
            // TODO: Handle sensitive data logging
            //Debug($"Executing asynchronous non query ({behaviour}): \n{stringCommand}\nWith parameters: {string.Join(',', parameters)}");
            using var connection = _Connection;
            await connection.OpenAsync();

            using var command = new NpgsqlCommand(stringCommand, connection, transaction as NpgsqlTransaction);
            command.Parameters.AddRange((from param in parameters
                                         select new NpgsqlParameter(param.Id, param.Value ?? DBNull.Value)).ToArray());

            return await command.ExecuteNonQueryAsync();
        }
        public Task<int> ExecuteNonQueryAsync(string command, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters) =>
            ExecuteAdvancedNonQueryAsync(command, CommandBehavior.Default, transaction, parameters);

        public async Task<T?> ExecuteScalarAsync<T>(string command, IDbTransaction? transaction = null)
        {
            using var connection = _Connection;
            await connection.OpenAsync();

            using var cmd = new NpgsqlCommand(command, connection);
            return (T?)await cmd.ExecuteScalarAsync();
        }
        #endregion

        #region Get
        #region ByID
        public async Task<(T? Value, IDBBaseObject[] Context)> GetByIdAsync<T, TId>(TId id, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var (commandPart, parameters) = await GetIdPropertiesAsync<T, TId>(id);

            var dbParts = await ExecuteAdvancedQueryAsync($"SELECT * FROM {GetTableName<T>()} WHERE {commandPart} LIMIT 1", CommandBehavior.KeyInfo, transaction, parameters);
            using IDbConnection connection = dbParts.Item1;
            using DbDataReader dbReader = dbParts.Item2;

            if (!dbReader.HasRows || !await dbReader.ReadAsync())
                return (default, []);

            return await ConvertToAsync<T, TId>(dbReader, transaction?.Connection ?? connection, context);
        }
        public async Task<(object? Value, IDBBaseObject[] Context)> GetByIdAsync<TId>(TId id, Type dbObjectType, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where TId : notnull
        {
            var parentInfo = GetRequiredTypeInfo(dbObjectType);
            return await GetByIdAsync(id, parentInfo, transaction, context);
        }
        public async Task<(object? Value, IDBBaseObject[] Context)> GetByIdAsync<TId>(TId id, JsonTypeInfo parentInfo, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where TId : notnull
        {
            var idInfo = GetRequiredTypeInfo<TId>();

            return await GetByIdAsync(id, idInfo, parentInfo, transaction, context);
        }
        public async Task<(object? Value, IDBBaseObject[] Context)> GetByIdAsync(object id, JsonTypeInfo idInfo, JsonTypeInfo parentInfo, IDbTransaction? transaction = null, params IDBBaseObject[] context)
        {
            var (commandPart, parameters) = await GetIdPropertiesAsync(id, idInfo, parentInfo);

            var dbParts = await ExecuteAdvancedQueryAsync($"SELECT * FROM {GetTableName(parentInfo.Type)} WHERE {commandPart} LIMIT 1", CommandBehavior.KeyInfo, transaction, parameters);
            using IDbConnection connection = dbParts.Item1;
            using DbDataReader dbReader = dbParts.Item2;

            if (!dbReader.HasRows || !await dbReader.ReadAsync())
                return default;

            return await ConvertToAsync(dbReader, parentInfo, transaction?.Connection ?? connection);
        }
        #endregion
        #region ByCondition
        public async Task<T?> GetWhen<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new()
        {
            var result = await ExecuteAdvancedQueryAsync($"SELECT * FROM {GetTableName<T>()} WHERE {condition} LIMIT 1;", CommandBehavior.SingleRow, transaction, parameters);
            using IDbConnection connection = result.Item1;
            using DbDataReader reader = result.Item2;

            if (!await reader.ReadAsync())
                return default;

            return (await ConvertToAsync<T, TId>(reader, transaction?.Connection ?? connection)).Value;
        }
        public async Task<T?> GetWhenNullable<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters)
           where T : IDBObject<TId>, new()
        {
            var result = await ExecuteAdvancedQueryNullableAsync($"SELECT * FROM {GetTableName<T>()} WHERE {condition} LIMIT 1;", CommandBehavior.SingleRow, transaction, parameters);
            using IDbConnection connection = result.Item1;
            using DbDataReader reader = result.Item2;

            if (!await reader.ReadAsync())
                return default;

            return (await ConvertToAsync<T, TId>(reader, transaction?.Connection ?? connection)).Value;
        }

        public Task<T?> GetWhenAdvanced<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters) where T : IDBObject<TId>, new()
        {
            throw new NotImplementedException();
        }

        public async IAsyncEnumerable<T> GetMultiple<T, TId>(string command, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters) where T : IDBObject<TId>, new()
        {
            var result = await ExecuteAdvancedQueryAsync(command, CommandBehavior.SequentialAccess, transaction, parameters);
            using IDbConnection connection = result.Item1;
            using DbDataReader reader = result.Item2;

            while (await reader.ReadAsync())
            {
                var conversionResult = (await ConvertToAsync<T, TId>(reader, transaction?.Connection ?? connection)).Value;
                if (conversionResult == null)
                    continue;

                yield return conversionResult;
            }
        }
        public async IAsyncEnumerable<T> GetMultipleNullable<T, TId>(string command, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters) where T : IDBObject<TId>, new()
        {
            var result = await ExecuteAdvancedQueryNullableAsync(command, CommandBehavior.SequentialAccess, transaction, parameters);
            using IDbConnection connection = result.Item1;
            using DbDataReader reader = result.Item2;

            while (await reader.ReadAsync())
            {
                var conversionResult = (await ConvertToAsync<T, TId>(reader, transaction?.Connection ?? connection)).Value;
                if (conversionResult == null)
                    continue;

                yield return conversionResult;
            }
        }
        public async IAsyncEnumerable<T> GetMultipleWhen<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters) where T : IDBObject<TId>, new()
        {
            var result = await ExecuteAdvancedQueryAsync($"SELECT * FROM {GetTableName<T>()} WHERE {condition}", CommandBehavior.SequentialAccess, transaction, parameters);
            using IDbConnection connection = result.Item1;
            using DbDataReader reader = result.Item2;

            while (await reader.ReadAsync())
            {
                var conversionResult = (await ConvertToAsync<T, TId>(reader, transaction?.Connection ?? connection)).Value;
                if (conversionResult == null)
                    continue;

                yield return conversionResult;
            }
        }

        public IAsyncEnumerable<T> GetMultipleWhenAdvanced<T, TId>(string condition, bool distinct, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters) where T : IDBObject<TId>, new()
        {
            throw new NotImplementedException();
        }
        #endregion
        #endregion

        #region Update
        private object GetDbObjectUniqueId(object dbObject)
        {
            var dbObjectTypeInfo = GetRequiredTypeInfo(dbObject.GetType());
            var idValue = dbObjectTypeInfo.Properties.First(x => x.IsRequired).Get!(dbObject)!;
            var idType = idValue.GetType();

            if (idType.IsGenericType)
                return idType.GetFields()[0].GetValue(idValue)!;
            else
                return idValue;
        }

        public async Task UpdateAsync<T, TId>(T instance, IDbTransaction? transaction = null, params string[] propertyNames)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var typeInfo = GetRequiredTypeInfo<T>();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            var (whereCommandPart, parameters) = await GetIdPropertiesAsync<T, TId>(instance);
            StringBuilder setCommandPart = new();

            List<(string, object?)> parameterList = new(parameters);
            foreach (var property in propertyNames)
            {
                string name = JsonNamingPolicy.SnakeCaseLower.ConvertName(property).Replace("(", "").Replace(")", "");
                setCommandPart.Append($"{name} = @{name},");

                // TODO: Handle if the value of the property is IDBObject, then need to take the id value instead of the whole IDBObject
                var value = typeInfo.Properties.First(x => x.Name.StartsWith(name)).Get!(instance);
                if (value == null)
                {
                    parameterList.Add((name, DBNull.Value));
                    continue;
                }

                var valueType = value.GetType();
                if (valueType.IsEnum)
                    parameterList.Add((name, Convert.ChangeType(value, Enum.GetUnderlyingType(valueType))));
                else if (valueType.IsAssignableTo(typeof(IDBBaseObject)))
                    parameterList.Add((name, GetDbObjectUniqueId(value)));
                else
                    parameterList.Add((name, value));
            }

            await ExecuteAdvancedNonQueryAsync($"UPDATE {GetTableName<T>()} SET {setCommandPart.ToString().TrimEnd(',')} WHERE {whereCommandPart}", CommandBehavior.Default, transaction, [.. parameterList]);
        }
        public async Task UpdateAsyncOverride<T, TId>(T instance, (string Name, NpgsqlDbType Type)[] overrides, IDbTransaction? transaction = null, params string[] propertyNames)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var typeInfo = GetRequiredTypeInfo<T>();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            var (whereCommandPart, parameters) = await GetIdPropertiesAsync<T, TId>(instance);
            StringBuilder setCommandPart = new();

            List<(string Name, object? Value, NpgsqlDbType? Type)> parameterList = new();

            foreach (var param in parameters)
            {
                var typeOverride = overrides.FirstOrDefault(o => o.Name == param.Item1).Type;
                parameterList.Add((param.Item1, param.Item2, typeOverride != default ? typeOverride : null));
            }

            foreach (var property in propertyNames)
            {
                string name = JsonNamingPolicy.SnakeCaseLower.ConvertName(property).Replace("(", "").Replace(")", "");
                setCommandPart.Append($"{name} = @{name},");

                var value = typeInfo.Properties.First(x => x.Name.StartsWith(name)).Get!(instance);
                if (value == null)
                {
                    var typeOverride = overrides.FirstOrDefault(o => o.Name == name).Type;
                    parameterList.Add((name, DBNull.Value, typeOverride != default ? typeOverride : null));
                    continue;
                }

                var valueType = value.GetType();
                if (valueType.IsEnum)
                {
                    var typeOverride = overrides.FirstOrDefault(o => o.Name == name).Type;
                    parameterList.Add((name, Convert.ChangeType(value, Enum.GetUnderlyingType(valueType)),
                        typeOverride != default ? typeOverride : null));
                }
                else if (valueType.IsAssignableTo(typeof(IDBBaseObject)))
                {
                    var typeOverride = overrides.FirstOrDefault(o => o.Name == name).Type;
                    parameterList.Add((name, GetDbObjectUniqueId(value), typeOverride != default ? typeOverride : null));
                }
                else
                {
                    var typeOverride = overrides.FirstOrDefault(o => o.Name == name).Type;
                    parameterList.Add((name, value, typeOverride != default ? typeOverride : null));
                }
            }

            using var connection = _Connection;
            await connection.OpenAsync();

            using var command = new NpgsqlCommand(
                $"UPDATE {GetTableName<T>()} SET {setCommandPart.ToString().TrimEnd(',')} WHERE {whereCommandPart}",
                connection,
                transaction as NpgsqlTransaction);

            foreach (var param in parameterList)
            {
                if (param.Type.HasValue)
                {
                    var npgParam = new NpgsqlParameter(param.Name, param.Type.Value)
                    {
                        Value = param.Value ?? DBNull.Value
                    };
                    command.Parameters.Add(npgParam);
                }
                else
                {
                    command.Parameters.AddWithValue(param.Name, param.Value ?? DBNull.Value);
                }
            }

            await command.ExecuteNonQueryAsync();
        }
        #endregion

        #region Insert
        public async Task<T> InsertAsync<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var typeInfo = GetRequiredTypeInfo<T>();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            StringBuilder valueDefPart = new();
            StringBuilder valuesPart = new();
            StringBuilder idReturns = new();

            List<(string, object?)> parameterList = new();
            foreach (var property in typeInfo.Properties)
            {
                if (property.Get == null)
                    continue;

                var value = property.Get!(instance);
                if (value == null)
                    continue;
                else if (value.GetType().IsEnum)
                    value = Convert.ChangeType(value, value.GetType().GetEnumUnderlyingType());
                else if (value is IDBBaseObject)
                {
                    var idValues = await GetDbObjectIdValuesAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.FirstOrDefault(x => x.Item1 == idVal.Id) != default)
                            continue;

                        parameterList.Add(idVal);
                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }
                else if (property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                {
                    var idValues = await GetTupleValueAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.FirstOrDefault(x => x.Item1 == idVal.Id) != default)
                            continue;

                        var idValType = idVal.Value?.GetType();
                        if (idVal.Value != null && idValType!.IsEnum)
                            parameterList.Add((idVal.Id, Convert.ChangeType(idVal.Value, idValType.GetEnumUnderlyingType())));
                        else
                            parameterList.Add(idVal);

                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }

                if (property.IsRequired && (forceGenerateId || value == null))
                {
                    idReturns.Append($"{property.Name.Replace("(", "").Replace(")", "")},");
                    continue;
                }
                else if (value == null)
                    continue;
                else if (property.IsRequired && !forceGenerateId && property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                    continue;

                // TODO: Handle if the value of the property is IDBObject, then need to take the id value instead of the whole IDBObject
                if (value is IDBBaseObject)
                    continue;

                valueDefPart.Append($"{property.Name.Trim(['(', ')'])},");
                valuesPart.Append($"@{property.Name.Trim(['(', ')'])},");

                parameterList.Add((property.Name.Trim(['(', ')']), value));
            }

            var idReturnPart = idReturns.ToString().TrimEnd(',');
            var dbParts = await ExecuteAdvancedQueryAsync($"INSERT INTO {GetTableName<T>()}({valueDefPart.ToString().TrimEnd(',')}) VALUES({valuesPart.ToString().TrimEnd(',')}){(string.IsNullOrEmpty(idReturnPart) ? string.Empty : $"RETURNING {idReturnPart}")}", CommandBehavior.SingleResult, transaction, [.. parameterList.Distinct()]);
            using IDbConnection connection = dbParts.Item1;
            using DbDataReader dbReader = dbParts.Item2;

            if (!await dbReader.ReadAsync())
                return instance;

            List<IDBBaseObject> contexts = new(context);

            var idProperty = typeInfo.Properties.First(x => x.IsRequired);

            var dbReturnParts = idReturnPart.Split(',');
            var dbReturnPartsValues = (from part in dbReturnParts
                                       select dbReader.GetValue(dbReader.GetOrdinal(part))).ToArray();

            await SetValueAsync(instance, dbReturnPartsValues, idProperty, contexts, transaction?.Connection ?? connection);

            return instance;
        }

        public async Task<T?> TryInsertAsync<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            try
            {
                return await InsertAsync<T, TId>(instance, forceGenerateId, transaction, context);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString() + ex.Message);
                return default;
            }
        }

        public async Task<T> InsertAsyncOverride<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, IDBBaseObject[]? context = null, params (string Name, NpgsqlDbType Type)[] overrides)
     where T : IDBObject<TId>, new()
     where TId : notnull
        {
            var typeInfo = GetRequiredTypeInfo<T>();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            StringBuilder valueDefPart = new();
            StringBuilder valuesPart = new();
            StringBuilder idReturns = new();

            List<(string Name, object? Value, NpgsqlDbType? Type)> parameterList = new();
            foreach (var property in typeInfo.Properties)
            {
                if (property.Get == null)
                    continue;

                var value = property.Get!(instance);
                if (value == null)
                    continue;
                else if (value.GetType().IsEnum)
                    value = Convert.ChangeType(value, value.GetType().GetEnumUnderlyingType());
                else if (value is IDBBaseObject)
                {
                    var idValues = await GetDbObjectIdValuesAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.FirstOrDefault(x => x.Name == idVal.Id) != default)
                            continue;

                        // Check if there's an override for this property
                        var typeOverride = overrides.FirstOrDefault(o => o.Name == idVal.Id).Type;
                        parameterList.Add((idVal.Id, idVal.Value, typeOverride != default ? typeOverride : null));
                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }
                else if (property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                {
                    var idValues = await GetTupleValueAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.FirstOrDefault(x => x.Name == idVal.Id) != default)
                            continue;

                        var idValType = idVal.Value?.GetType();
                        if (idVal.Value != null && idValType!.IsEnum)
                        {
                            // Check if there's an override for this property
                            var typeOverride = overrides.FirstOrDefault(o => o.Name == idVal.Id).Type;
                            parameterList.Add((idVal.Id, Convert.ChangeType(idVal.Value, idValType.GetEnumUnderlyingType()),
                                typeOverride != default ? typeOverride : null));
                        }
                        else
                        {
                            // Check if there's an override for this property
                            var typeOverride = overrides.FirstOrDefault(o => o.Name == idVal.Id).Type;
                            parameterList.Add((idVal.Id, idVal.Value, typeOverride != default ? typeOverride : null));
                        }

                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }

                if (property.IsRequired && (forceGenerateId || value == null))
                {
                    idReturns.Append($"{property.Name.Replace("(", "").Replace(")", "")},");
                    continue;
                }
                else if (value == null)
                    continue;
                else if (property.IsRequired && !forceGenerateId && property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                    continue;

                // TODO: Handle if the value of the property is IDBObject, then need to take the id value instead of the whole IDBObject
                if (value is IDBBaseObject)
                    continue;

                string propName = property.Name.Trim(['(', ')']);
                valueDefPart.Append($"{propName},");
                valuesPart.Append($"@{propName},");

                // Check if there's an override for this property
                var propTypeOverride = overrides.FirstOrDefault(o => o.Name == propName).Type;
                parameterList.Add((propName, value, propTypeOverride != default ? propTypeOverride : null));
            }

            var idReturnPart = idReturns.ToString().TrimEnd(',');

            // Use the connection
            using var connection = _Connection;
            await connection.OpenAsync();

            // Create the command
            using var command = new NpgsqlCommand(
                $"INSERT INTO {GetTableName<T>()}({valueDefPart.ToString().TrimEnd(',')}) " +
                $"VALUES({valuesPart.ToString().TrimEnd(',')})" +
                $"{(string.IsNullOrEmpty(idReturnPart) ? string.Empty : $" RETURNING {idReturnPart}")}",
                connection,
                transaction as NpgsqlTransaction);

            // Add parameters with type overrides where specified
            foreach (var param in parameterList)
            {
                if (param.Type.HasValue)
                {
                    var npgParam = new NpgsqlParameter(param.Name, param.Type.Value)
                    {
                        Value = param.Value ?? DBNull.Value
                    };
                    command.Parameters.Add(npgParam);
                }
                else
                {
                    command.Parameters.AddWithValue(param.Name, param.Value ?? DBNull.Value);
                }
            }

            // Execute the command
            using var dbReader = await command.ExecuteReaderAsync(CommandBehavior.SingleResult);

            if (!await dbReader.ReadAsync())
                return instance;

            List<IDBBaseObject> contexts = new(context ?? Array.Empty<IDBBaseObject>());

            var idProperty = typeInfo.Properties.First(x => x.IsRequired);

            var dbReturnParts = idReturnPart.Split(',');
            var dbReturnPartsValues = (from part in dbReturnParts
                                       select dbReader.GetValue(dbReader.GetOrdinal(part))).ToArray();

            await SetValueAsync(instance, dbReturnPartsValues, idProperty, contexts, connection);

            return instance;
        }

        public async Task<T?> TryInsertAsyncOverride<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, IDBBaseObject[]? context = null, params (string Name, NpgsqlDbType Type)[] overrides)
    where T : IDBObject<TId>, new()
    where TId : notnull
        {
            try
            {
                return await InsertAsyncOverride<T, TId>(instance, forceGenerateId, transaction, context, overrides);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString() + ex.Message);
                return default;
            }
        }
        private List<FieldInfo> GetTupleFields(object tupleValue)
        {
            var firstTupleFields = tupleValue.GetType().GetFields(BindingFlags.Public | BindingFlags.Instance);
            List<FieldInfo> tupleFields = [];
            foreach (var tupleField in firstTupleFields)
            {
                var tupleFieldValue = tupleField.GetValue(tupleValue);
                if (IsTuple(tupleField.FieldType) && tupleFieldValue != null)
                    tupleFields.AddRange(GetTupleFields(tupleFieldValue));
                else if (tupleField.FieldType.IsAssignableTo(typeof(IDBBaseObject)) && tupleFieldValue != null)
                {
                    var idTuple = GetTypeInfo(tupleField.FieldType)!.Properties.First(x => x.IsRequired);
                    if (IsTuple(idTuple.PropertyType))
                    {
                        var newTupleFields = GetTupleFields(idTuple.Get!(tupleField.GetValue(tupleValue)!)!);
                        tupleFields.AddRange(newTupleFields.Select(x => tupleField));
                    }
                    else
                        tupleFields.Add(tupleField);
                }
                else
                    tupleFields.Add(tupleField);
            }

            return tupleFields;
        }

        private async Task<IEnumerable<(string Id, object? Value)>> GetTupleValueAsync(object tupleValue, JsonPropertyInfo propertyInfo)
        {
            var dbNames = propertyInfo.Name.Replace("(", "").Replace(")", "").Split(',');
            List<FieldInfo> tupleFields = GetTupleFields(tupleValue);

            List<(string Id, object? Value)> values = [];
            for (int i = 0; i < tupleFields.Count; i++)
            {
                var fieldValue = tupleFields[i].GetValue(tupleValue);
                if (fieldValue == null)
                    values.Add((dbNames[i], DBNull.Value));
                else if (tupleFields[i].FieldType.IsAssignableTo(typeof(IDBBaseObject)))
                {
                    var typeInfo = GetRequiredTypeInfo(tupleFields[i].FieldType);
                    var innerValues = await GetDbObjectIdValuesAsync(fieldValue, typeInfo.Properties.First(x => x.IsRequired));

                    if (!innerValues.Any())
                        throw new Exception("The ID attribute must be filled when trying to Insert");

                    i--;
                    foreach (var innerValue in innerValues)
                    {
                        i++;
                        var innerType = innerValue.Value.GetType();
                        if (innerType.IsGenericType && IsTuple(innerType.GetGenericTypeDefinition()))
                            values.Add((dbNames[i], (innerValue.Value as dynamic).Item1));
                        else
                            values.Add((dbNames[i], innerValue.Value));
                    }
                }
                else
                    values.Add((dbNames[i], fieldValue));
            }

            return values;
        }
        private async Task<IEnumerable<(string Id, object? Value)>> GetDbObjectIdValuesAsync(object propValue, JsonPropertyInfo propertyInfo)
        {
            var type = propertyInfo.PropertyType;
            var objectType = propValue.GetType();

            // This method is only for IDBObjects
            if (!objectType.IsAssignableTo(typeof(IDBBaseObject)))
                return [];

            var dbObjectIdProp = GetRequiredTypeInfo(objectType).Properties.First(x => x.IsRequired);
            var idValue = dbObjectIdProp.Get!(propValue)!;

            if (IsTuple(dbObjectIdProp.PropertyType))
                return await GetTupleValueAsync(idValue, propertyInfo);
            else if (dbObjectIdProp.PropertyType.IsAssignableFrom(typeof(IDBBaseObject)))
                return await GetDbObjectIdValuesAsync(idValue, dbObjectIdProp);
            else
                return [(propertyInfo.Name.Trim(['(', ')']), idValue)];
        }

        #endregion

        #region Removal
        public async Task<bool> DeleteByIdAsync<T, TId>(T instance, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var id = await GetIdPropertiesAsync<T, TId>(instance.ID);
            var removed = await ExecuteNonQueryAsync($"DELETE FROM {GetTableName<T>()} WHERE {id.CommandPart}", transaction, id.Parameters);

            return removed > 0;
        }
        public async Task<bool> TryDeleteByIdAsync<T, TId>(T instance, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            try
            {
                return await DeleteByIdAsync<T, TId>(instance);
            }
            catch
            {
                return false;
            }
        }
        #endregion

        #region Batching
        public async Task<DbTransaction> CreateTransactionAsync()
        {
            var db = _Connection;
            await db.OpenAsync();


            return await db.BeginTransactionAsync();
        }
        public async Task<DbBatch> CreateBatchAsync(DbTransaction? transaction = null)
        {
            var db = _Connection;
            await db.OpenAsync();

            DbBatch batch = new NpgsqlBatch(db);
            return batch;
        }

        public DbBatchCommand AddBatchCommand(DbBatch batch, string commandText, params (string Id, object Value)[] parameters)
        {
            var cmd = batch.CreateBatchCommand();
            cmd.CommandText = commandText;
            cmd.CommandType = CommandType.Text;
            cmd.Parameters.AddRange((from param in parameters
                                     select new NpgsqlParameter(param.Id, param.Value ?? DBNull.Value)).ToArray());

            batch.BatchCommands.Add(cmd);
            return cmd;
        }

        #region Get
        public async Task<DbBatchCommand> BatchGetByIdAsync(DbBatch batch, object id, JsonTypeInfo idInfo, JsonTypeInfo parentInfo, params IDBBaseObject[] context)
        {
            var (commandPart, parameters) = await GetIdPropertiesAsync(id, idInfo, parentInfo);

            var cmd = AddBatchCommand(batch, $"SELECT * FROM {GetTableName(parentInfo.Type)} WHERE {commandPart} LIMIT 1", parameters);
            return cmd;
        }
        #endregion
        #region Insert
        public async Task<DbBatchCommand> BatchInsertAsync<T, TId>(
            DbBatch batch,
            T instance,
            bool forceGenerateId = true,
            DbConflictHandling conflictHandling = DbConflictHandling.ThrowException,
            params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var typeInfo = GetRequiredTypeInfo<T>();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            StringBuilder valueDefPart = new();
            StringBuilder valuesPart = new();
            StringBuilder updatePart = new();
            StringBuilder idReturns = new();

            List<(string, object?)> parameterList = new();

            foreach (var property in typeInfo.Properties)
            {
                if (property.Get == null) continue;

                var value = property.Get(instance);
                if (value == null) continue;

                if (value.GetType().IsEnum)
                    value = Convert.ChangeType(value, value.GetType().GetEnumUnderlyingType());

                if (value is IDBBaseObject)
                {
                    var idValues = await GetDbObjectIdValuesAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.Any(x => x.Item1 == idVal.Id)) continue;

                        parameterList.Add(idVal);
                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }
                else if (property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                {
                    var idValues = await GetTupleValueAsync(value, property);
                    foreach (var idVal in idValues)
                    {
                        if (parameterList.Any(x => x.Item1 == idVal.Id)) continue;

                        parameterList.Add(idVal);
                        valueDefPart.Append($"{idVal.Id},");
                        valuesPart.Append($"@{idVal.Id},");
                    }
                }

                if (property.IsRequired)
                {
                    idReturns.Append($"{property.Name.Replace("(", "").Replace(")", "")},");
                    continue;
                }
                else if (value == null)
                    continue;

                if (property.IsRequired && !forceGenerateId && property.PropertyType.IsGenericType && IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                    continue;

                if (value is IDBBaseObject) continue;

                string columnName = property.Name.Trim(['(', ')']);
                valueDefPart.Append($"{columnName},");
                valuesPart.Append($"@{columnName},");
                parameterList.Add((columnName, value));

                if (conflictHandling == DbConflictHandling.UpdateExisting)
                {
                    updatePart.Append($"{columnName} = EXCLUDED.{columnName},");
                }
            }

            var idReturnPart = idReturns.ToString().TrimEnd(',');
            string tableName = GetTableName<T>();

            string sqlQuery = $"INSERT INTO {tableName} ({valueDefPart.ToString().TrimEnd(',')}) " +
                              $"VALUES ({valuesPart.ToString().TrimEnd(',')})";

            if (conflictHandling == DbConflictHandling.DoNothing)
            {
                sqlQuery += " ON CONFLICT DO NOTHING";
            }
            else if (conflictHandling == DbConflictHandling.UpdateExisting)
            {
                sqlQuery += $" ON CONFLICT ({idReturnPart}) DO UPDATE SET {updatePart.ToString().TrimEnd(',')}";
            }

            if (!string.IsNullOrEmpty(idReturnPart))
            {
                sqlQuery += $" RETURNING {idReturnPart}";
            }

            var cmd = AddBatchCommand(batch, sqlQuery, [.. parameterList]);

            return cmd;
        }

        #endregion
        #endregion

        #region Conversion
        private async Task<(string CommandPart, (string Id, object Value)[] Parameters)> GetIdPropertiesAsync<T, TId>(T instance)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await GetIdPropertiesAsync<T, TId>(instance.ID);
        }
        private async Task<(string CommandPart, (string Id, object Value)[] Parameters)> GetIdPropertiesAsync<T, TId>(TId idInstance)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            var idType = idInstance.GetType();
            var idTypeInfo = GetRequiredTypeInfo<TId>();

            var instanceType = typeof(T);
            var instanceTypeInfo = GetRequiredTypeInfo<T>();
            return await GetIdPropertiesAsync(idInstance, idTypeInfo, instanceTypeInfo);
        }
        private async Task<(string CommandPart, (string Id, object Value)[] Parameters)> GetIdPropertiesAsync(object idInstance, JsonTypeInfo idTypeInfo, JsonTypeInfo instanceTypeInfo)
        {
            string name = instanceTypeInfo.Properties.First(x => x.IsRequired).Name;

            // Filling all the id names
            StringBuilder commandBuilder = new();
            var nameParts = name.Split(','); // user_id, (asd, asd_second), id
            foreach (var namePart in nameParts)
            {
                var changedNamePart = namePart.Trim([',', ' ', ')', '(']);
                if (commandBuilder.ToString().Contains($"@{changedNamePart}"))
                    continue;
                commandBuilder.Append($"{changedNamePart}=@{changedNamePart} AND ");
            }

            Dictionary<string, object> parameters = [];
            if (idTypeInfo.Type.IsAssignableTo(typeof(IDBBaseObject)))
            {
                // Get all names and all values, all should be specified in Name => user_id, user_passkey_id
                var idProperty = idTypeInfo.Properties.First(x => x.IsRequired);
                var idPropValue = idProperty.Get!(idInstance);
                if (idPropValue == null)
                    return (commandBuilder.ToString().TrimEnd(['A', 'N', 'D', ' ']), [(name, DBNull.Value)]);

                // Can return multiple id values
                var idDbObjectParameters = await GetIdParameters(idPropValue, nameParts);
                foreach (var param in idDbObjectParameters)
                    parameters.TryAdd(param.Id, param.Value);
            }
            else if (IsTuple(idTypeInfo.Type))
            {
                var tupleParams = await GetIdParameters(idInstance, nameParts);
                return (commandBuilder.ToString().TrimEnd(['A', 'N', 'D', ' ']), tupleParams);
            }
            else
                return (commandBuilder.ToString().TrimEnd(['A', 'N', 'D', ' ']), [(name, idInstance)]);

            return (commandBuilder.ToString().TrimEnd(['A', 'N', 'D', ' ']), parameters.Select(x => (x.Key, x.Value)).ToArray());
        }

        public async Task<(T? Value, IDBBaseObject[] Context)> ConvertToAsync<T, TId>(DbDataReader reader, IDbConnection? connection = null, params IDBBaseObject[] contexts) where T : IDBObject<TId>, new()
        {
            var newInstance = new T();
            var typeInfo = GetRequiredTypeInfo<T>();

            return await ConvertToAsyncInternal(reader, typeInfo, newInstance, connection, contexts);
        }
        public async Task<(object? Value, IDBBaseObject[] Context)> ConvertToAsync<TId>(DbDataReader reader, Type objectType, IDbConnection? connection = null, params IDBBaseObject[] contexts)
        {
            var typeInfo = GetRequiredTypeInfo(objectType);
            return await ConvertToAsync(reader, typeInfo, connection, contexts);
        }
        public async Task<(object? Value, IDBBaseObject[] Context)> ConvertToAsync(DbDataReader reader, JsonTypeInfo objectType, IDbConnection? connection = null, params IDBBaseObject[] contexts)
        {
            var newInstance = objectType.CreateObject!();
            return await ConvertToAsyncInternal(reader, objectType, newInstance, connection, contexts);
        }
        private async Task<(T? Value, IDBBaseObject[] Context)> ConvertToAsyncInternal<T>(DbDataReader reader, JsonTypeInfo typeInfo, T instance, IDbConnection? connection = null, params IDBBaseObject[] contexts)
            where T : notnull
        {
            List<IDBBaseObject> context = [.. contexts];
            var schema = await reader.GetColumnSchemaAsync();

            List<int> usedColumns = [];
            for (int i = 0; i < schema.Count; i++)
            {
                if (usedColumns.Contains(i))
                    continue;

                object? colValue = null;
                if (!reader.IsDBNull(i))
                    colValue = reader.GetValue(i);

                colValue = colValue == DBNull.Value ? null : colValue;

                var colName = reader.GetName(i);

                var currentProperty = typeInfo.Properties.FirstOrDefault(x => x.Name == colName);

                // Tuples
                if (currentProperty == null)
                {
                    currentProperty = typeInfo.Properties.FirstOrDefault(x => x.Name.Contains(colName));
                    if (currentProperty == null)
                        continue;

                    var tupleTypeInfo = GetRequiredTypeInfo(currentProperty.PropertyType);
                    var tupleInstance = currentProperty.Get!(instance) ?? tupleTypeInfo.CreateObject!();

                    var tupleLength = tupleTypeInfo.Type.GetGenericArguments().Length;
                    if (tupleLength == 0)
                        continue;

                    var colNames = currentProperty.Name.Replace("(", "").Replace(")", "").Split(',');
                    object?[] values = new object[tupleLength];
                    for (int ii = 0; ii < tupleLength; ii++)
                    {
                        var ordinal = reader.GetOrdinal(colNames[ii]);
                        try
                        {
                            values[ii] = reader.GetValue(ordinal);
                        }
                        catch
                        {
                            // Sequential Access read cannot access ordinal 0... (new error)
                            continue;
                        }
                        values[ii] = values[ii] == DBNull.Value ? null : values[ii];

                        usedColumns.Add(ordinal);
                    }

                    var result = await SetTupleValuesAsync(tupleInstance, values, tupleTypeInfo, connection, contexts);
                    currentProperty.Set!(instance, result.Value);
                    continue;
                }
                else if (currentProperty.PropertyType.IsEnum)
                    colValue = Enum.ToObject(currentProperty.PropertyType, colValue ?? 0);
                else if (currentProperty.PropertyType.IsGenericType && currentProperty.PropertyType.GetGenericTypeDefinition() == typeof(Nullable<>) && Nullable.GetUnderlyingType(currentProperty.PropertyType)!.IsEnum) // Nullable error
                    colValue = Enum.ToObject(Nullable.GetUnderlyingType(currentProperty.PropertyType)!, colValue ?? 0);

                if (colValue != null)
                    if (currentProperty.PropertyType == typeof(ulong))
                        colValue = decimal.ToUInt64((decimal)colValue);
                    else if (currentProperty.PropertyType == typeof(float))
                        colValue = Convert.ChangeType(colValue, typeof(float));
                    else if (currentProperty.PropertyType == typeof(int))
                        colValue = Convert.ChangeType(colValue, typeof(int));
                    else if (currentProperty.PropertyType == typeof(long))
                        colValue = Convert.ChangeType(colValue, typeof(long));
                    else if (currentProperty.PropertyType == typeof(short))
                        colValue = Convert.ChangeType(colValue, typeof(short));
                    else if (currentProperty.PropertyType == typeof(double))
                        colValue = decimal.ToDouble((decimal)colValue);

                currentProperty.Set!(instance, colValue);
            }

            return (instance, [.. context]);
        }

        private async Task<(List<IDBBaseObject> Context, int UsedValues)> SetValueAsync(object instance, object?[] values, JsonPropertyInfo property, List<IDBBaseObject> contexts, IDbConnection? connection = null)
        {
            var value = values[0];
            int usedValues = 1;

            if (value is null || value is DBNull)
                return (contexts, usedValues);

            // IDBObject<> handling and Tuples
            if (property.PropertyType.IsGenericType)
            {
                if (property.PropertyType.GetGenericTypeDefinition() == typeof(IDBObject<>))
                {
                    var dbObjectInstance = await FillDbObjectFromValuesAsync(property.PropertyType, values, connection, [.. contexts]);
                    property.Set(instance, dbObjectInstance.Value);
                    usedValues = dbObjectInstance.UsedValues;
                }
                else if (IsTuple(property.PropertyType.GetGenericTypeDefinition()))
                {
                    var tupleInstance = property.Get!(instance);
                    var tupleTypeInfo = GetRequiredTypeInfo(property.PropertyType);
                    if (tupleInstance == null)
                    {
                        tupleInstance = tupleTypeInfo.CreateObject!();
                        property.Set!(instance, tupleInstance);
                    }

                    var result = await SetTupleValuesAsync(tupleInstance!, values, tupleTypeInfo, connection, [.. contexts]);
                    property.Set(instance, result.Value);
                    usedValues = result.UsedValues;
                }
            }
            else
                property.Set!(instance, value);

            return (contexts, usedValues);
        }
        #endregion

        public async Task<TVal?> GetScopedIdAsync<T, TVal>(string scopedIdName, string scopeCondition, IDbTransaction? transaction = null, params (string, object?)[] parameters) where T : IDBBaseObject
        {
            var result = await ExecuteAdvancedQueryAsync($"SELECT MAX({scopedIdName}) FROM {GetTableName<T>()} WHERE {scopeCondition} LIMIT 1", CommandBehavior.SingleRow, transaction, parameters);
            using var connection = result.Item1;
            using var reader = result.Item2;
            if (!await reader.ReadAsync())
                return default;

            var value = reader.GetValue(0);
            if (value == DBNull.Value)
                return default;
            else
                return (TVal)value;
        }

        #region Utility 
        public string GetTableName<T>() where T : IDBBaseObject
        {
            return _TableMapping[typeof(T).Name];
        }
        private string GetTableName(Type type)
        {
            return _TableMapping[type.Name];
        }

        private JsonTypeInfo? GetTypeInfo<T>()
        {
            var type = typeof(T);
            return GetTypeInfo(type);
        }
        private JsonTypeInfo? GetTypeInfo(Type type)
        {
            return _JsonResolver.GetTypeInfo(type, _JsonOptions);
        }
        private JsonTypeInfo GetRequiredTypeInfo<T>()
        {
            var type = typeof(T);
            return GetRequiredTypeInfo(type);
        }
        private JsonTypeInfo GetRequiredTypeInfo(Type type)
        {
            return _JsonResolver.GetTypeInfo(type, _JsonOptions)
                ?? throw new ArgumentNullException($"Failed to get JsonTypeInfo for type {type.Name}!");
        }

        private static TVal? GetValueFromPropertyInfo<T, TVal>(JsonPropertyInfo typeInfo, TVal idInstance) where T : IDBObject<TVal>, new()
        {
            if (typeInfo.Get == null)
                throw new NullReferenceException($"The property {typeInfo.Name} does not have any public getter!");

            return (TVal?)typeInfo.Get(new T() { ID = idInstance });
        }

        private async Task<(string Id, object Value)[]> GetIdParameters(object idInstance, params string[] ids)
        {
            var idType = idInstance.GetType();
            var idTypeInfo = GetRequiredTypeInfo(idType);

            if (idType.IsAssignableTo(typeof(IDBBaseObject)))
            {
                var idProperty = idTypeInfo.Properties.First(x => x.IsRequired);
                var idPropValue = idProperty.Get!(idInstance);
                if (idPropValue == null)
                    return [(ids[0], DBNull.Value)];

                return await GetIdParameters(idPropValue, ids);
            }
            else if (IsTuple(idType))
            {
                var fields = GetTupleFields(idInstance);

                List<(string Id, object Value)> parameters = [];
                var min = Math.Min(ids.Length, fields.Count);
                for (int i = 0; i < min; i++)
                {
                    var fieldName = ids[i];
                    var value = fields[i].GetValue(idInstance);

                    if (ids[i].Contains('('))
                    {
                        if (value == null)
                            throw new ArgumentNullException($"The field value should not be null, when getting id parameters. {idType.Name} - {string.Join(',', fields.Select(x => x.Name))}");

                        // Tuple or IDBObject start
                        var foundObjectEnd = GetObjectEnd(i, min, ids);
                        if (foundObjectEnd < 0)
                            throw new DataException($"Failed to find object end in ID name for type {idType.Name}. [{string.Join(',', ids)}]");

                        ids[i] = ids[i].Trim([' ', '(']);
                        ids[foundObjectEnd] = ids[foundObjectEnd].Trim([' ', ')']);
                        var localIds = i == foundObjectEnd ? [ids[i]] : ids[i..foundObjectEnd];

                        if (fields[i].FieldType.IsAssignableTo(typeof(IDBBaseObject)))
                        {
                            var valueType = value.GetType();
                            var valueTypeInfo = GetRequiredTypeInfo(valueType);

                            var idProp = valueTypeInfo.Properties.First(x => x.IsRequired);
                            var idPropValue = idProp.Get!(value);
                            if (idPropValue == null)
                                throw new ArgumentNullException($"The ID value should not be null, when getting id parameters for IDBObject<??>. PROP: {idProp.Name}. {idType.Name} - {string.Join(',', fields.Select(x => x.Name))}");

                            var dbParams = await GetIdParameters(idPropValue, localIds);
                            parameters.AddRange(dbParams);
                        }
                        else if (IsTuple(fields[i].FieldType))
                        {
                            var tupleParams = await GetIdParameters(value, localIds);
                            parameters.AddRange(tupleParams);
                        }


                        i = foundObjectEnd; // Next iteration will go foundObjectEnd + 1
                        continue;
                    }


                    // Converting enum to underlying type
                    if (fields[i].FieldType.IsEnum)
                        value = Convert.ChangeType(value, Enum.GetUnderlyingType(fields[i].FieldType));

                    parameters.Add((ids[i], value ?? DBNull.Value));
                }

                return parameters.ToArray();
            }

            // Converting enum to underlying type
            if (idType.IsEnum)
                idInstance = Convert.ChangeType(idInstance, Enum.GetUnderlyingType(idType));

            return [(ids[0], idInstance)];
        }

        private int GetObjectEnd(int startIndex, int maxLen, string[] ids)
        {
            for (; startIndex < maxLen; startIndex++)
            {
                if (ids[startIndex].Contains(')'))
                    return startIndex;
            }

            return -1;
        }

        private static bool IsTuple(Type type)
        {
            if (!type.IsGenericType)
                return false;

            var genericTypeDefinition = type.GetGenericTypeDefinition();
            return genericTypeDefinition == typeof(ValueTuple<>)
                || genericTypeDefinition == typeof(ValueTuple<,>)
                || genericTypeDefinition == typeof(ValueTuple<,,>)
                || genericTypeDefinition == typeof(ValueTuple<,,,>)
                || genericTypeDefinition == typeof(ValueTuple<,,,,>)
                || genericTypeDefinition == typeof(Tuple<>)
                || genericTypeDefinition == typeof(Tuple<,>)
                || genericTypeDefinition == typeof(Tuple<,,>)
                || genericTypeDefinition == typeof(Tuple<,,,>)
                || genericTypeDefinition == typeof(Tuple<,,,,>);
        }

        private async Task<(object Value, int UsedValues)> SetTupleValuesAsync(object tupleInstance, object[] values, JsonTypeInfo? tupleTypeInfo = null, IDbConnection? connection = null, params IDBBaseObject[] context)
        {
            var tupleType = tupleInstance.GetType();
            var fields = tupleType.GetFields();
            tupleTypeInfo ??= GetRequiredTypeInfo(tupleType);

            int valueIndex = 0;
            for (int i = 0; i < fields.Length; i++)
            {
                if (fields[i].FieldType.IsGenericType && IsTuple(fields[i].FieldType.GetGenericTypeDefinition()))
                {
                    var tupleSize = fields[i].FieldType.GetGenericArguments().Length;
                    var tupleInfoTupe = GetRequiredTypeInfo(fields[i].FieldType);
                    var newTupleInstance = tupleInfoTupe.CreateObject!();

                    newTupleInstance = await SetTupleValuesAsync(newTupleInstance, values[valueIndex..], tupleInfoTupe, connection, context);

                    valueIndex += tupleSize;
                    fields[i].SetValue(tupleInstance, newTupleInstance);
                    continue;
                }
                else if (fields[i].FieldType.IsAssignableTo(typeof(IDBBaseObject)))
                {
                    var scopedValues = values[valueIndex..];
                    if (scopedValues.Length == 0)
                        scopedValues = values[(values.Length - 1)..];

                    var foundValue = await FillDbObjectFromValuesAsync(fields[i].FieldType, scopedValues, connection, context);

                    valueIndex += foundValue.UsedValues;
                    fields[i].SetValue(tupleInstance, foundValue.Value);
                    continue;
                }

                fields[i].SetValue(tupleInstance, values[valueIndex]);
                valueIndex++;
            }

            return (tupleInstance, valueIndex);
        }
        private async Task<(object? Value, int UsedValues)> FillDbObjectFromValuesAsync(Type dbObjectType, object[] values, IDbConnection? connection = null, params IDBBaseObject[] context)
        {
            var dbObjectTypeInfo = GetRequiredTypeInfo(dbObjectType);
            var idType = dbObjectTypeInfo.Properties.First(x => x.IsRequired).PropertyType;
            var idTypeInfo = GetRequiredTypeInfo(idType);
            object? idInstance = null;
            int usedValues = 0;

            if (idType.IsGenericType && IsTuple(idType.GetGenericTypeDefinition()))
            {
                var tupleInstance = idTypeInfo.CreateObject!();
                var result = await SetTupleValuesAsync(tupleInstance, values, idTypeInfo, connection, context);
                usedValues += result.UsedValues;
                idInstance = result.Value;
            }
            else if (idType.IsAssignableTo(typeof(IDBBaseObject)))
            {
                // TODO: Performance, make use of the context
                var result = await FillDbObjectFromValuesAsync(idType, values, connection, context);
                usedValues += result.UsedValues;
                idInstance = result.Value;
            }
            else
            {
                idInstance = values[0];
                usedValues++;
            }

            if (idInstance == null)
                return (null, usedValues);

            var (Value, _) = await GetByIdAsync(idInstance, idTypeInfo, GetRequiredTypeInfo(dbObjectType), null, context);
            return (Value, usedValues);
        }
        #endregion
    }
}
