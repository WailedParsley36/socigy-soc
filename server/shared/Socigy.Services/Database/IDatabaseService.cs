using Npgsql;
using NpgsqlTypes;
using Socigy.Services.Database.Enums;
using Socigy.Structures.Database;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlTypes;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization.Metadata;
using System.Threading.Tasks;

namespace Socigy.Services.Database
{
    public interface IDatabaseService : IService
    {
        Task<(IDbConnection, DbDataReader)> ExecuteQueryAsync(string query, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters);
        Task<(IDbConnection, DbDataReader)> ExecuteAdvancedQueryAsync(string query, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters);
        Task<IEnumerable<T>> ExecuteQueryAsync<T>(string query, Func<DbDataReader, T> transformationFunc, params (string Id, object Value)[] parameters);

        Task<(IDbConnection, DbDataReader)> ExecuteAdvancedQueryNullableAsync(string query, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters);
        Task<(IDbConnection, DbDataReader)> ExecuteQueryNullableAsync(string query, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters);

        Task<T?> GetSingleValue<T>(string query, Func<DbDataReader, T> transformationFunc, params (string Id, object Value)[] parameters);
        Task<T?> GetSingleValue<T>(string query, Func<DbDataReader, T> transformationFunc, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters);

        Task<int> ExecuteNonQueryAsync(string command, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters);
        Task<int> ExecuteAdvancedNonQueryAsync(string command, CommandBehavior behaviour, IDbTransaction? transaction = null, params (string Id, object Value)[] parameters);

        Task<T?> ExecuteScalarAsync<T>(string command, IDbTransaction? transaction = null);

        // TODO: Add table joining level. For example find IDBObjects at deep level 2 max then stop searching.
        // TODO: Add option to disallow table joining
        #region Get
        #region ByID
        Task<(T? Value, IDBBaseObject[] Context)> GetByIdAsync<T, TId>(TId id, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        Task<(object? Value, IDBBaseObject[] Context)> GetByIdAsync<TId>(TId id, Type dbObjectType, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where TId : notnull;
        Task<(object? Value, IDBBaseObject[] Context)> GetByIdAsync<TId>(TId id, JsonTypeInfo dbObjectType, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where TId : notnull;
        #endregion
        #region ByCondition
        Task<T?> GetWhen<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new();
        Task<T?> GetWhenNullable<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters)
           where T : IDBObject<TId>, new();
        Task<T?> GetWhenAdvanced<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new();
        IAsyncEnumerable<T> GetMultiple<T, TId>(string command, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new();
        IAsyncEnumerable<T> GetMultipleNullable<T, TId>(string command, IDbTransaction? transaction = null, params (string Name, object? Value, NpgsqlDbType Type)[] parameters)
            where T : IDBObject<TId>, new();
        IAsyncEnumerable<T> GetMultipleWhen<T, TId>(string condition, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new();
        IAsyncEnumerable<T> GetMultipleWhenAdvanced<T, TId>(string condition, bool distinct, IDbTransaction? transaction = null, params (string Name, object Value)[] parameters)
            where T : IDBObject<TId>, new();
        #endregion
        #endregion

        #region Update
        Task UpdateAsync<T, TId>(T instance, IDbTransaction? transaction = null, params string[] propertyNames)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        Task UpdateAsyncOverride<T, TId>(T instance, (string Name, NpgsqlDbType Type)[] overrides, IDbTransaction? transaction = null, params string[] propertyNames)
        where T : IDBObject<TId>, new()
        where TId : notnull;
        #endregion

        #region Insert
        Task<T> InsertAsync<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull;

        Task<T?> TryInsertAsync<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull;

        Task<T?> TryInsertAsyncOverride<T, TId>(T instance, bool forceGenerateId = true, IDbTransaction? transaction = null, IDBBaseObject[]? context = null, params (string Name, NpgsqlDbType Type)[] overrides)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        #endregion

        #region Removal
        Task<bool> DeleteByIdAsync<T, TId>(T instance, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        Task<bool> TryDeleteByIdAsync<T, TId>(T instance, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        #endregion

        #region Batch Operations
        Task<DbTransaction> CreateTransactionAsync();
        Task<DbBatch> CreateBatchAsync(DbTransaction? transaction = null);
        DbBatchCommand AddBatchCommand(DbBatch batch, string commandText, params (string Id, object Value)[] parameters);

        #region Get
        Task<DbBatchCommand> BatchGetByIdAsync(DbBatch batch, object id, JsonTypeInfo idInfo, JsonTypeInfo parentInfo, params IDBBaseObject[] context);
        #endregion
        #region Insert
        Task<DbBatchCommand> BatchInsertAsync<T, TId>(DbBatch batch, T instance, bool forceGenerateId = true, DbConflictHandling conflictHandling = DbConflictHandling.ThrowException, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull;
        #endregion
        #endregion

        #region Conversion
        Task<(T? Value, IDBBaseObject[] Context)> ConvertToAsync<T, TId>(DbDataReader reader, IDbConnection? connection = null, params IDBBaseObject[] contexts)
             where T : IDBObject<TId>, new();
        Task<(object? Value, IDBBaseObject[] Context)> ConvertToAsync<TId>(DbDataReader reader, Type objectType, IDbConnection? connection = null, params IDBBaseObject[] contexts);
        Task<(object? Value, IDBBaseObject[] Context)> ConvertToAsync(DbDataReader reader, JsonTypeInfo objectType, IDbConnection? connection = null, params IDBBaseObject[] contexts);
        #endregion

        string GetTableName<T>() where T : IDBBaseObject;
        Task<TVal?> GetScopedIdAsync<T, TVal>(string scopedIdName, string scopeCondition, IDbTransaction? transaction = null, params (string, object?)[] parameters)
            where T : IDBBaseObject;
    }
}
