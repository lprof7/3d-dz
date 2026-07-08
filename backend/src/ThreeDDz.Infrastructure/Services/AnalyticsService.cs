using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUserRepository _userRepo;
    private readonly IReviewRepository _reviewRepo;

    public AnalyticsService(IOrderRepository orderRepo, IProductRepository productRepo,
        IUserRepository userRepo, IReviewRepository reviewRepo)
    {
        _orderRepo = orderRepo;
        _productRepo = productRepo;
        _userRepo = userRepo;
        _reviewRepo = reviewRepo;
    }

    public async Task<AnalyticsSummary> GetAsync(DateTime? from, DateTime? to)
    {
        var orders = await _orderRepo.GetForAnalyticsAsync(from, to);
        var products = await _productRepo.GetForAnalyticsAsync();
        var allProducts = await _productRepo.GetAllAsync();
        var totalProducts = allProducts.Count(p => !p.IsDeleted);
        var newCustomers = await _userRepo.CountAsync(u =>
            u.Role == UserRole.Customer && u.CreatedAt >= DateTime.UtcNow.AddDays(-30));

        var topProducts = orders
            .SelectMany(o => o.Items)
            .GroupBy(i => i.ProductId)
            .Select(g => new TopProductStat(
                ProductId: g.Key,
                Name: g.First().ProductName.En,
                OrderCount: g.Sum(i => i.Quantity)))
            .OrderByDescending(x => x.OrderCount)
            .Take(5)
            .ToList();

        var ordersByWilaya = orders
            .GroupBy(o => o.WilayaName)
            .ToDictionary(g => g.Key, g => g.Count());

        return new AnalyticsSummary(
            TotalOrders: orders.Count,
            PendingOrders: orders.Count(o => o.Status == OrderStatus.Pending),
            ConfirmedOrders: orders.Count(o => o.Status == OrderStatus.Confirmed),
            CompletedOrders: orders.Count(o => o.Status == OrderStatus.Completed),
            RejectedOrders: orders.Count(o => o.Status == OrderStatus.Rejected),
            NewCustomersLast30Days: (int)newCustomers,
            TotalProducts: totalProducts,
            TopProducts: topProducts,
            OrdersByWilaya: ordersByWilaya
        );
    }
}
