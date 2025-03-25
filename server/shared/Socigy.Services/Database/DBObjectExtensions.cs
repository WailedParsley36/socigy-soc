using NpgsqlTypes;
using Socigy.Structures.Database;
using System.Data;
using System.Diagnostics.CodeAnalysis;

namespace Socigy.Services.Database
{
    public static class DBObjectExtensions
    {
        public static async Task UpdateAsyncOverride<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, (string Name, NpgsqlDbType Type)[] overrides, IDbTransaction? transaction = null, params string[] propertyNames)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            await database.UpdateAsyncOverride<T, TId>(dbObject, overrides, transaction, propertyNames);
        }
        public static async Task UpdateAsync<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, IDbTransaction? transaction = null, params string[] propertyNames)
    where T : IDBObject<TId>, new()
    where TId : notnull
        {
            await database.UpdateAsync<T, TId>(dbObject, transaction, propertyNames);
        }

        public static async Task<T> InsertAsync<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await database.InsertAsync<T, TId>(dbObject, transaction: transaction, context: context);
        }

        public static async Task<T?> TryInsertAsync<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await database.TryInsertAsync<T, TId>(dbObject, transaction: transaction, context: context);
        }

        public static async Task<T?> TryInsertAsync<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, bool forceGenerateId, IDbTransaction? transaction = null, params IDBBaseObject[] context)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await database.TryInsertAsync<T, TId>(dbObject, forceGenerateId, transaction: transaction, context: context);
        }

        public static async Task<T?> TryInsertAsyncOverride<T, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields)] TId>(this T dbObject, IDatabaseService database, bool forceGenerateId, IDbTransaction? transaction = null, IDBBaseObject[]? context = null, params (string Name, NpgsqlDbType Type)[] overrides)
    where T : IDBObject<TId>, new()
    where TId : notnull
        {
            return await database.TryInsertAsyncOverride<T, TId>(dbObject, forceGenerateId, transaction: transaction, context: context, overrides);
        }

        public static async Task<bool> DeleteAsync<T, TId>(this T dbObject, IDatabaseService database, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await database.DeleteByIdAsync<T, TId>(dbObject, transaction);
        }
        public static async Task<bool> TryDeleteAsync<T, TId>(this T dbObject, IDatabaseService database, IDbTransaction? transaction = null)
            where T : IDBObject<TId>, new()
            where TId : notnull
        {
            return await database.TryDeleteByIdAsync<T, TId>(dbObject, transaction);
        }
    }
}
