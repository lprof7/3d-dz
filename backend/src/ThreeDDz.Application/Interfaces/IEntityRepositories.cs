using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Application.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
}

public interface IProductRepository : IRepository<Product>
{
    Task<List<Product>> SearchAsync(string? text, string? categoryId, decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take);
    Task<List<Product>> GetFeaturedAsync(int take);
    Task<List<Product>> GetNewestAsync(int take);
    Task<List<Product>> GetAllAdminAsync();
    Task<List<Product>> GetByCategoryAsync(string categoryId, int skip, int take);
    Task<List<Product>> GetByCollectionAsync(string collectionId, int skip, int take);
    Task<List<Product>> GetRelatedAsync(string productId, string categoryId, int take);
    Task<List<Product>> GetForAnalyticsAsync();
    Task UpdateAvgRatingAsync(string productId);
    Task<(List<Product> Items, long TotalCount)> SearchWithCountAsync(string? text, string? categoryId, decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take);
}

public interface ICategoryRepository : IRepository<Category>
{
    Task<Category?> GetBySlugAsync(string slug);
    Task<bool> HasProductsAsync(string categoryId);
}

public interface ICollectionRepository : IRepository<Collection>
{
    Task<Collection?> GetBySlugAsync(string slug);
}

public interface IOrderRepository : IRepository<Order>
{
    Task<List<Order>> GetByCustomerAsync(string customerId);
    Task<List<Order>> GetRecentAsync(int take);
    Task<List<Order>> GetForAnalyticsAsync(DateTime? from, DateTime? to);
    Task<List<Order>> GetByFilterAsync(OrderFilter filter);
    Task<long> GetTodayCountAsync();
    Task<long> CountByStatusAsync(OrderStatus status, DateTime? from, DateTime? to);
    Task<List<TopProductStat>> GetTopProductsAsync(int take, DateTime? from, DateTime? to);
    Task<Dictionary<string, int>> GetOrdersByWilayaAsync(DateTime? from, DateTime? to);
    Task<Dictionary<string, int>> GetCountPerCustomerAsync();
}

public interface IReviewRepository : IRepository<Review>
{
    Task<List<Review>> GetByProductApprovedAsync(string productId);
    Task<List<Review>> GetByCustomerAndProductAsync(string customerId, string productId);
    Task<Dictionary<string, double>> GetAverageRatingsAsync(IEnumerable<string> productIds);
}

public interface IFavoriteRepository : IRepository<Favorite>
{
    Task<List<Favorite>> GetByCustomerAsync(string customerId);
    Task<Favorite?> GetByCustomerAndProductAsync(string customerId, string productId);
    Task DeleteByCustomerAndProductAsync(string customerId, string productId);
}

public interface ICartRepository : IRepository<Cart>
{
    Task<Cart?> GetByCustomerAsync(string customerId);
}

public interface IBannerRepository : IRepository<Banner>
{
    Task<List<Banner>> GetActiveAsync();
}

public interface IWilayaRepository : IRepository<Wilaya>
{
    Task<Wilaya?> GetByCodeAsync(int code);
}
