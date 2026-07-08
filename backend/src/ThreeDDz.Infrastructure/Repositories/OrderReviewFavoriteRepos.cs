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
