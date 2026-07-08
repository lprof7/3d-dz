using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Repositories;

public class ProductRepository : MongoRepository<Product>, IProductRepository
{
    public ProductRepository(MongoContext context) : base(context) { }

    public async Task<List<Product>> SearchAsync(string? text, string? categoryId,
        decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take)
    {
        var filters = new List<FilterDefinition<Product>>
        {
            Builders<Product>.Filter.Eq(p => p.IsDeleted, false),
            Builders<Product>.Filter.Eq(p => p.IsPublished, true)
        };

        if (!string.IsNullOrWhiteSpace(text))
        {
            var escaped = System.Text.RegularExpressions.Regex.Escape(text);
            filters.Add(Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex("name.ar", new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                Builders<Product>.Filter.Regex("name.fr", new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                Builders<Product>.Filter.Regex("name.en", new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                Builders<Product>.Filter.Regex("description.ar", new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                Builders<Product>.Filter.Regex("description.fr", new MongoDB.Bson.BsonRegularExpression(escaped, "i")),
                Builders<Product>.Filter.Regex("description.en", new MongoDB.Bson.BsonRegularExpression(escaped, "i"))
            ));
        }
        if (!string.IsNullOrWhiteSpace(categoryId))
            filters.Add(Builders<Product>.Filter.Eq(p => p.CategoryId, categoryId));
        if (minPrice.HasValue)
            filters.Add(Builders<Product>.Filter.Gte(p => p.Price, minPrice.Value));
        if (maxPrice.HasValue)
            filters.Add(Builders<Product>.Filter.Lte(p => p.Price, maxPrice.Value));

        var combined = filters.Count > 1
            ? Builders<Product>.Filter.And(filters)
            : filters[0];

        var sortDef = sort switch
        {
            "price_asc" => Builders<Product>.Sort.Ascending(p => p.Price),
            "price_desc" => Builders<Product>.Sort.Descending(p => p.Price),
            "oldest" => Builders<Product>.Sort.Ascending(p => p.CreatedAt),
            _ => Builders<Product>.Sort.Descending(p => p.CreatedAt)
        };

        return await Collection.Find(combined)
            .Sort(sortDef).Skip(skip).Limit(take).ToListAsync();
    }

    public async Task<List<Product>> GetFeaturedAsync(int take) =>
        await Collection.Find(p => p.IsFeatured && !p.IsDeleted && p.IsPublished)
            .SortByDescending(p => p.CreatedAt).Limit(take).ToListAsync();

    public async Task<List<Product>> GetNewestAsync(int take) =>
        await Collection.Find(p => !p.IsDeleted && p.IsPublished)
            .SortByDescending(p => p.CreatedAt).Limit(take).ToListAsync();

    public async Task<List<Product>> GetByCategoryAsync(string categoryId, int skip, int take) =>
        await Collection.Find(p => p.CategoryId == categoryId && !p.IsDeleted && p.IsPublished)
            .SortByDescending(p => p.CreatedAt).Skip(skip).Limit(take).ToListAsync();

    public async Task<List<Product>> GetByCollectionAsync(string collectionId, int skip, int take) =>
        await Collection.Find(p => p.CollectionIds.Contains(collectionId) && !p.IsDeleted && p.IsPublished)
            .SortByDescending(p => p.CreatedAt).Skip(skip).Limit(take).ToListAsync();

    public async Task<List<Product>> GetRelatedAsync(string productId, string categoryId, int take) =>
        await Collection.Find(p => p.Id != productId && p.CategoryId == categoryId && !p.IsDeleted && p.IsPublished)
            .SortByDescending(p => p.CreatedAt).Limit(take).ToListAsync();

    public async Task<List<Product>> GetForAnalyticsAsync() =>
        await Collection.Find(p => !p.IsDeleted).ToListAsync();
}
