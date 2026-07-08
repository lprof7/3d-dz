using System.Linq.Expressions;
using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Infrastructure.Repositories;

public class MongoRepository<T> : IRepository<T> where T : class
{
    protected readonly IMongoCollection<T> Collection;
    protected readonly MongoContext Context;

    public MongoRepository(MongoContext context)
    {
        Context = context;
        Collection = context.GetCollection<T>();
    }

    public async Task<List<T>> GetAllAsync() =>
        await Collection.Find(Builders<T>.Filter.Empty).ToListAsync();

    public async Task<T?> GetByIdAsync(string id) =>
        await Collection.Find(Builders<T>.Filter.Eq("_id", id)).FirstOrDefaultAsync();

    public async Task<List<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
        await Collection.Find(predicate).ToListAsync();

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate) =>
        await Collection.Find(predicate).FirstOrDefaultAsync();

    public async Task InsertAsync(T entity) =>
        await Collection.InsertOneAsync(entity);

    public async Task UpdateAsync(string id, T entity) =>
        await Collection.ReplaceOneAsync(Builders<T>.Filter.Eq("_id", id), entity);

    public async Task DeleteAsync(string id) =>
        await Collection.DeleteOneAsync(Builders<T>.Filter.Eq("_id", id));

    public async Task<long> CountAsync(Expression<Func<T, bool>>? predicate = null) =>
        predicate == null
            ? await Collection.CountDocumentsAsync(Builders<T>.Filter.Empty)
            : await Collection.CountDocumentsAsync(predicate);
}
