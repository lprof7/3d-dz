using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Application.Interfaces;

public interface IAuthService
{
    Task<(User user, string token)> RegisterAsync(string fullName, string email, string password, string? phone);
    Task<(User user, string token)> LoginAsync(string email, string password);
    Task RequestPasswordResetAsync(string email);
    Task<bool> ResetPasswordAsync(string token, string newPassword);
    Task<User?> GetByIdAsync(string userId);
    Task<User> UpdateProfileAsync(string userId, string? fullName, string? phone, int? wilayaCode);
    Task ChangePasswordAsync(string userId, string currentPassword, string newPassword);
}

public interface IProductService
{
    Task<Product> CreateAsync(Product product);
    Task<Product> UpdateAsync(string id, Product product);
    Task SoftDeleteAsync(string id);
    Task ToggleFeaturedAsync(string id);
    Task<List<Product>> SearchAsync(string? text, string? categoryId, decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take);
    Task<(List<Product> Items, long TotalCount)> SearchWithCountAsync(string? text, string? categoryId, decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take);
    Task<Product?> GetByIdAsync(string id);
    Task<Product?> GetBySlugAsync(string slug);
    Task<List<Product>> GetFeaturedAsync(int take = 8);
    Task<List<Product>> GetNewestAsync(int take = 8);
    Task<List<Product>> GetAllAdminAsync();
    Task<List<Product>> GetRelatedAsync(string productId, int take = 4);
}

public interface ICategoryService
{
    Task<Category> CreateAsync(Category category);
    Task<Category> UpdateAsync(string id, Category category);
    Task<bool> CanDeleteAsync(string id);
    Task<bool> DeleteAsync(string id);
    Task<List<Category>> GetAllAsync();
    Task<Category?> GetBySlugAsync(string slug);
    Task<Category?> GetByIdAsync(string id);
}

public interface ICollectionService
{
    Task<Collection> CreateAsync(Collection collection);
    Task<Collection> UpdateAsync(string id, Collection collection);
    Task DeleteAsync(string id);
    Task<List<Collection>> GetAllAsync();
    Task<Collection?> GetBySlugAsync(string slug);
    Task<List<Product>> GetProductsAsync(string collectionId);
}

public interface IOrderService
{
    Task<Order> PlaceAsync(string customerId, Order order);
    Task<Order?> GetByIdAsync(string id);
    Task<List<Order>> GetMineAsync(string customerId);
    Task<List<Order>> GetAllAsync();
    Task<Order> ChangeStatusAsync(string id, int status, string adminUserId);
    Task<Order> AddInternalNoteAsync(string id, string text, string adminUserId);
    Task<List<Order>> GetByFilterAsync(OrderFilter filter);
    Task<List<string>> GetPurchasedProductIdsAsync(string customerId);
    Task<List<Product>> GetDownloadableProductsAsync(string customerId);
}

public class OrderFilter
{
    public OrderStatus? Status { get; set; }
    public int? WilayaCode { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; }
    public string? CustomerId { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}

public interface IReviewService
{
    Task<Review> SubmitOrUpdateAsync(string customerId, string customerName, string productId, string? orderId, int rating, string comment);
    Task<List<Review>> GetForProductAsync(string productId);
    Task<Review> ChangeStatusAsync(string id, int status);
    Task<List<Review>> GetPendingAsync();
    Task<List<Review>> GetAllAsync();
    Task<bool> CanReviewAsync(string customerId, string productId);
}

public interface IFavoriteService
{
    Task ToggleAsync(string customerId, string productId);
    Task<List<Product>> GetMyFavoritesAsync(string customerId);
    Task<bool> IsFavoriteAsync(string customerId, string productId);
}

public interface ICartService
{
    Task<Cart> GetAsync(string customerId);
    Task AddAsync(string customerId, string productId, int qty);
    Task UpdateQtyAsync(string customerId, string productId, int qty);
    Task RemoveAsync(string customerId, string productId);
    Task ClearAsync(string customerId);
    Task<List<Product>> GetProductsAsync(string customerId);
}

public interface IBannerService
{
    Task<List<Banner>> GetActiveAsync();
    Task<Banner> UpsertAsync(Banner banner);
    Task DeleteAsync(string id);
    Task<List<Banner>> GetAllAsync();
}

public interface IWilayaService
{
    Task<List<Wilaya>> GetAllAsync();
    Task SeedAsync(List<Wilaya> wilayas);
}

public interface ITranslationService
{
    Task<string> TranslateAsync(string text, string source, string target);
    Task<LocalizedString> EnsureAllLanguagesAsync(LocalizedString input, string sourceLang);
}

public interface IImageKitService
{
    Task<string> UploadFileAsync(Stream stream, string fileName, string folder = "3d-dz");
    string PublicKey { get; }
}

public interface INotificationService
{
    Task OrderReceivedAsync(Order order);
    Task OrderStatusChangedAsync(Order order);
    Task PasswordResetAsync(string email, string resetUrl);
    Task AdminNewOrderAsync(Order order);
}

public interface IAnalyticsService
{
    Task<AnalyticsSummary> GetAsync(DateTime? from, DateTime? to);
}

public record AnalyticsSummary(
    int TotalOrders,
    int PendingOrders,
    int ConfirmedOrders,
    int CompletedOrders,
    int RejectedOrders,
    int NewCustomersLast30Days,
    int TotalProducts,
    List<TopProductStat> TopProducts,
    Dictionary<string, int> OrdersByWilaya
);

public record TopProductStat(string ProductId, string Name, int OrderCount);

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType);
    Task DeleteAsync(string url);
}
