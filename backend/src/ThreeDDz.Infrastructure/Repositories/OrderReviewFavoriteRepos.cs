using MongoDB.Bson;
using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Repositories;

public class OrderRepository : MongoRepository<Order>, IOrderRepository
{
    public OrderRepository(MongoContext context) : base(context) { }

    public async Task<List<Order>> GetByCustomerAsync(string customerId) =>
        await Collection.Find(o => o.CustomerId == customerId)
            .SortByDescending(o => o.CreatedAt).ToListAsync();

    public async Task<List<Order>> GetRecentAsync(int take) =>
        await Collection.Find(Builders<Order>.Filter.Empty)
            .SortByDescending(o => o.CreatedAt).Limit(take).ToListAsync();

    public async Task<List<Order>> GetForAnalyticsAsync(DateTime? from, DateTime? to)
    {
        var filter = Builders<Order>.Filter.Empty;
        if (from.HasValue || to.HasValue)
        {
            var filters = new List<FilterDefinition<Order>>();
            if (from.HasValue)
                filters.Add(Builders<Order>.Filter.Gte(o => o.CreatedAt, from.Value));
            if (to.HasValue)
                filters.Add(Builders<Order>.Filter.Lte(o => o.CreatedAt, to.Value));
            filter = Builders<Order>.Filter.And(filters);
        }
        return await Collection.Find(filter).ToListAsync();
    }

    public async Task<List<Order>> GetByFilterAsync(OrderFilter filter)
    {
        var filters = new List<FilterDefinition<Order>>();
        if (filter.Status.HasValue)
            filters.Add(Builders<Order>.Filter.Eq(o => o.Status, filter.Status.Value));
        if (filter.WilayaCode.HasValue)
            filters.Add(Builders<Order>.Filter.Eq(o => o.WilayaCode, filter.WilayaCode.Value));
        if (filter.FromDate.HasValue)
            filters.Add(Builders<Order>.Filter.Gte(o => o.CreatedAt, filter.FromDate.Value));
        if (filter.ToDate.HasValue)
            filters.Add(Builders<Order>.Filter.Lte(o => o.CreatedAt, filter.ToDate.Value));
        if (!string.IsNullOrWhiteSpace(filter.CustomerId))
            filters.Add(Builders<Order>.Filter.Eq(o => o.CustomerId, filter.CustomerId));
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLowerInvariant();
            filters.Add(Builders<Order>.Filter.Or(
                Builders<Order>.Filter.Regex(o => o.CustomerFullName, new MongoDB.Bson.BsonRegularExpression(s, "i")),
                Builders<Order>.Filter.Regex(o => o.Reference, new MongoDB.Bson.BsonRegularExpression(s, "i"))
            ));
        }

        var combined = filters.Count == 0
            ? Builders<Order>.Filter.Empty
            : filters.Count == 1 ? filters[0]
            : Builders<Order>.Filter.And(filters);

        return await Collection.Find(combined)
            .SortByDescending(o => o.CreatedAt)
            .Skip(filter.Skip).Limit(filter.Take)
            .ToListAsync();
    }

    public async Task<long> GetTodayCountAsync()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        return await Collection.CountDocumentsAsync(
            Builders<Order>.Filter.And(
                Builders<Order>.Filter.Gte(o => o.CreatedAt, today),
                Builders<Order>.Filter.Lt(o => o.CreatedAt, tomorrow)
            ));
    }

    public async Task<long> CountByStatusAsync(OrderStatus status, DateTime? from, DateTime? to)
    {
        var filters = new List<FilterDefinition<Order>> { Builders<Order>.Filter.Eq(o => o.Status, status) };
        if (from.HasValue) filters.Add(Builders<Order>.Filter.Gte(o => o.CreatedAt, from.Value));
        if (to.HasValue) filters.Add(Builders<Order>.Filter.Lte(o => o.CreatedAt, to.Value));
        return await Collection.CountDocumentsAsync(Builders<Order>.Filter.And(filters));
    }

    public async Task<List<TopProductStat>> GetTopProductsAsync(int take, DateTime? from, DateTime? to)
    {
        var match = Builders<Order>.Filter.Empty;
        if (from.HasValue || to.HasValue)
        {
            var filters = new List<FilterDefinition<Order>>();
            if (from.HasValue) filters.Add(Builders<Order>.Filter.Gte(o => o.CreatedAt, from.Value));
            if (to.HasValue) filters.Add(Builders<Order>.Filter.Lte(o => o.CreatedAt, to.Value));
            match = Builders<Order>.Filter.And(filters);
        }

        var pipeline = new BsonDocument[]
        {
            new("$match", match.ToBsonDocument()),
            new("$unwind", "$items"),
            new("$group", new BsonDocument
            {
                { "_id", "$items.productId" },
                { "name", new BsonDocument("$first", "$items.productName") },
                { "orderCount", new BsonDocument("$sum", "$items.quantity") }
            }),
            new("$sort", new BsonDocument("orderCount", -1)),
            new("$limit", take)
        };

        var results = new List<TopProductStat>();
        using var cursor = await Collection.AggregateAsync<BsonDocument>(pipeline);
        while (await cursor.MoveNextAsync())
        {
            foreach (var doc in cursor.Current)
            {
                var nameDoc = doc["name"].AsBsonDocument;
                var name = nameDoc.Contains("en") ? nameDoc["en"].AsString
                    : nameDoc.Contains("fr") ? nameDoc["fr"].AsString
                    : nameDoc.Contains("ar") ? nameDoc["ar"].AsString
                    : "";
                results.Add(new TopProductStat(
                    doc["_id"].AsString,
                    name,
                    doc["orderCount"].AsInt32
                ));
            }
        }
        return results;
    }

    public async Task<Dictionary<string, int>> GetOrdersByWilayaAsync(DateTime? from, DateTime? to)
    {
        var match = Builders<Order>.Filter.Empty;
        if (from.HasValue || to.HasValue)
        {
            var filters = new List<FilterDefinition<Order>>();
            if (from.HasValue) filters.Add(Builders<Order>.Filter.Gte(o => o.CreatedAt, from.Value));
            if (to.HasValue) filters.Add(Builders<Order>.Filter.Lte(o => o.CreatedAt, to.Value));
            match = Builders<Order>.Filter.And(filters);
        }

        var pipeline = new BsonDocument[]
        {
            new("$match", match.ToBsonDocument()),
            new("$group", new BsonDocument
            {
                { "_id", "$wilayaName" },
                { "count", new BsonDocument("$sum", 1) }
            })
        };

        var result = new Dictionary<string, int>();
        using var cursor = await Collection.AggregateAsync<BsonDocument>(pipeline);
        while (await cursor.MoveNextAsync())
        {
            foreach (var doc in cursor.Current)
            {
                result[doc["_id"].AsString] = doc["count"].AsInt32;
            }
        }
        return result;
    }

    public async Task<Dictionary<string, int>> GetCountPerCustomerAsync()
    {
        var pipeline = new BsonDocument[]
        {
            new("$group", new BsonDocument
            {
                { "_id", "$customerId" },
                { "count", new BsonDocument("$sum", 1) }
            })
        };
        var result = new Dictionary<string, int>();
        using var cursor = await Collection.AggregateAsync<BsonDocument>(pipeline);
        while (await cursor.MoveNextAsync())
        {
            foreach (var doc in cursor.Current)
            {
                result[doc["_id"].AsString] = doc["count"].AsInt32;
            }
        }
        return result;
    }
}

public class ReviewRepository : MongoRepository<Review>, IReviewRepository
{
    public ReviewRepository(MongoContext context) : base(context) { }

    public async Task<List<Review>> GetByProductApprovedAsync(string productId) =>
        await Collection.Find(r => r.ProductId == productId && r.Status == ReviewStatus.Approved)
            .SortByDescending(r => r.CreatedAt).ToListAsync();

    public async Task<List<Review>> GetByCustomerAndProductAsync(string customerId, string productId) =>
        await Collection.Find(r => r.CustomerId == customerId && r.ProductId == productId).ToListAsync();

    public async Task<Dictionary<string, double>> GetAverageRatingsAsync(IEnumerable<string> productIds)
    {
        var ids = productIds.ToList();
        if (!ids.Any()) return new();
        var filter = Builders<Review>.Filter.And(
            Builders<Review>.Filter.In(r => r.ProductId, ids),
            Builders<Review>.Filter.Eq(r => r.Status, ReviewStatus.Approved)
        );
        var result = new Dictionary<string, double>();
        foreach (var id in ids)
        {
            var avg = Collection.AsQueryable()
                .Where(r => r.ProductId == id && r.Status == ReviewStatus.Approved)
                .Average(r => (double?)r.Rating) ?? 0;
            result[id] = Math.Round(avg, 1);
        }
        return result;
    }
}

public class FavoriteRepository : MongoRepository<Favorite>, IFavoriteRepository
{
    public FavoriteRepository(MongoContext context) : base(context) { }

    public async Task<List<Favorite>> GetByCustomerAsync(string customerId) =>
        await Collection.Find(f => f.CustomerId == customerId).SortByDescending(f => f.CreatedAt).ToListAsync();

    public async Task<Favorite?> GetByCustomerAndProductAsync(string customerId, string productId) =>
        await Collection.Find(f => f.CustomerId == customerId && f.ProductId == productId).FirstOrDefaultAsync();

    public async Task DeleteByCustomerAndProductAsync(string customerId, string productId) =>
        await Collection.DeleteOneAsync(f => f.CustomerId == customerId && f.ProductId == productId);
}

public class CartRepository : MongoRepository<Cart>, ICartRepository
{
    public CartRepository(MongoContext context) : base(context) { }

    public async Task<Cart?> GetByCustomerAsync(string customerId) =>
        await Collection.Find(c => c.CustomerId == customerId).FirstOrDefaultAsync();
}
