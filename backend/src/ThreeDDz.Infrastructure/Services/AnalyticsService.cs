using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IProductRepository _productRepo;
    private readonly IUserRepository _userRepo;

    public AnalyticsService(IOrderRepository orderRepo, IProductRepository productRepo, IUserRepository userRepo)
    {
        _orderRepo = orderRepo;
        _productRepo = productRepo;
        _userRepo = userRepo;
    }

    public async Task<AnalyticsSummary> GetAsync(DateTime? from, DateTime? to)
    {
        var products = await _productRepo.GetForAnalyticsAsync();
        var totalProducts = products.Count(p => !p.IsDeleted);

        var newCustomers = await _userRepo.CountAsync(u =>
            u.Role == UserRole.Customer && u.CreatedAt >= DateTime.UtcNow.AddDays(-30));

        var pendingTask = _orderRepo.CountByStatusAsync(OrderStatus.Pending, from, to);
        var confirmedTask = _orderRepo.CountByStatusAsync(OrderStatus.Confirmed, from, to);
        var completedTask = _orderRepo.CountByStatusAsync(OrderStatus.Completed, from, to);
        var rejectedTask = _orderRepo.CountByStatusAsync(OrderStatus.Rejected, from, to);
        var topTask = _orderRepo.GetTopProductsAsync(5, from, to);
        var wilayaTask = _orderRepo.GetOrdersByWilayaAsync(from, to);

        await Task.WhenAll(pendingTask, confirmedTask, completedTask, rejectedTask, topTask, wilayaTask);

        return new AnalyticsSummary(
            TotalOrders: (int)(pendingTask.Result + confirmedTask.Result + completedTask.Result + rejectedTask.Result),
            PendingOrders: (int)pendingTask.Result,
            ConfirmedOrders: (int)confirmedTask.Result,
            CompletedOrders: (int)completedTask.Result,
            RejectedOrders: (int)rejectedTask.Result,
            NewCustomersLast30Days: (int)newCustomers,
            TotalProducts: totalProducts,
            TopProducts: topTask.Result,
            OrdersByWilaya: wilayaTask.Result
        );
    }
}
