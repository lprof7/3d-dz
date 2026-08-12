using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IProductRepository _productRepo;
    private readonly ICartRepository _cartRepo;
    private readonly INotificationService _notif;

    public OrderService(IOrderRepository orderRepo, IProductRepository productRepo,
        ICartRepository cartRepo, INotificationService notif)
    {
        _orderRepo = orderRepo;
        _productRepo = productRepo;
        _cartRepo = cartRepo;
        _notif = notif;
    }

    public async Task<Order> PlaceAsync(string customerId, Order order)
    {
        var cart = await _cartRepo.GetByCustomerAsync(customerId);
        if (cart == null || cart.Items.Count == 0)
            throw new InvalidOperationException("Cart is empty");

        var orderItems = new List<OrderItem>();
        foreach (var ci in cart.Items)
        {
            var product = await _productRepo.GetByIdAsync(ci.ProductId);
            if (product == null || product.IsDeleted) continue;
            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.EffectivePrice,
                Quantity = ci.Quantity
            });
        }

        if (orderItems.Count == 0)
            throw new InvalidOperationException("No valid products in cart");

        order.CustomerId = customerId;
        order.Items = orderItems;
        order.SubTotal = orderItems.Sum(i => i.LineTotal);
        order.Total = order.SubTotal;
        order.Reference = await GenerateReferenceAsync();
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        order.Status = OrderStatus.Pending;
        order.StatusHistory = new List<OrderNote>
        {
            new() { Text = "Order created", CreatedAt = DateTime.UtcNow, AdminId = customerId }
        };

        await _orderRepo.InsertAsync(order);
        cart.Items.Clear();
        await _cartRepo.UpdateAsync(cart.Id, cart);

        await _notif.OrderReceivedAsync(order);
        await _notif.AdminNewOrderAsync(order);

        return order;
    }

    public Task<Order?> GetByIdAsync(string id) => _orderRepo.GetByIdAsync(id);
    public Task<List<Order>> GetMineAsync(string customerId) => _orderRepo.GetByCustomerAsync(customerId);
    public Task<List<Order>> GetAllAsync() => _orderRepo.GetAllAsync();

    public async Task<Order> ChangeStatusAsync(string id, int status, string adminUserId)
    {
        if (!Enum.IsDefined(typeof(OrderStatus), status))
            throw new InvalidOperationException("Invalid order status");

        var order = await _orderRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Order not found");

        var newStatus = (OrderStatus)status;
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        order.StatusHistory.Add(new OrderNote
        {
            Text = $"Status changed to {newStatus}",
            CreatedAt = DateTime.UtcNow,
            AdminId = adminUserId,
            Status = (int)newStatus
        });
        await _orderRepo.UpdateAsync(id, order);
        await _notif.OrderStatusChangedAsync(order);
        return order;
    }

    public async Task<Order> AddInternalNoteAsync(string id, string text, string adminUserId)
    {
        var order = await _orderRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Order not found");

        order.InternalNotes.Add(new OrderNote
        {
            Text = text,
            CreatedAt = DateTime.UtcNow,
            AdminId = adminUserId
        });
        order.UpdatedAt = DateTime.UtcNow;
        await _orderRepo.UpdateAsync(id, order);
        return order;
    }

    public Task<List<Order>> GetByFilterAsync(OrderFilter filter) =>
        _orderRepo.GetByFilterAsync(filter);

    public async Task<List<string>> GetPurchasedProductIdsAsync(string customerId)
    {
        var orders = await _orderRepo.GetByCustomerAsync(customerId);
        var confirmed = orders.Where(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Completed);
        var ids = confirmed.SelectMany(o => o.Items).Select(i => i.ProductId).Distinct().ToList();
        return ids;
    }

    public async Task<List<Product>> GetDownloadableProductsAsync(string customerId)
    {
        var ids = await GetPurchasedProductIdsAsync(customerId);
        if (ids.Count == 0) return [];
        var products = await _productRepo.FindAsync(p => ids.Contains(p.Id));
        return products.Where(p => !string.IsNullOrWhiteSpace(p.ModelUrl)).ToList();
    }

    private async Task<string> GenerateReferenceAsync()
    {
        var todayCount = await _orderRepo.GetTodayCountAsync();
        return $"3DZ-{DateTime.UtcNow:yyyyMMdd}-{(todayCount + 1):D4}";
    }
}
