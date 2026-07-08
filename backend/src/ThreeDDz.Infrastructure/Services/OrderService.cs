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
        order.Reference = GenerateReference();
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        order.Status = OrderStatus.Pending;
        order.StatusHistory = new List<OrderNote>
        {
            new() { Text = "Order created", CreatedAt = DateTime.UtcNow, AdminId = customerId }
        };

        await _orderRepo.InsertAsync(order);

        // Clear cart after successful order
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
        var order = await _orderRepo.GetByIdAsync(id)
            ?? throw new InvalidOperationException("Order not found");

        var newStatus = (OrderStatus)status;
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        order.StatusHistory.Add(new OrderNote
        {
            Text = $"Status changed to {newStatus}",
            CreatedAt = DateTime.UtcNow,
            AdminId = adminUserId
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

    public async Task<List<Order>> GetByFilterAsync(OrderFilter filter)
    {
        var all = await _orderRepo.GetAllAsync();
        var query = all.AsEnumerable();

        if (filter.Status.HasValue)
            query = query.Where(o => o.Status == filter.Status.Value);
        if (filter.WilayaCode.HasValue)
            query = query.Where(o => o.WilayaCode == filter.WilayaCode.Value);
        if (filter.FromDate.HasValue)
            query = query.Where(o => o.CreatedAt >= filter.FromDate.Value);
        if (filter.ToDate.HasValue)
            query = query.Where(o => o.CreatedAt <= filter.ToDate.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLowerInvariant();
            query = query.Where(o =>
                o.CustomerFullName.ToLowerInvariant().Contains(s) ||
                o.Reference.ToLowerInvariant().Contains(s));
        }

        return query.OrderByDescending(o => o.CreatedAt)
            .Skip(filter.Skip).Take(filter.Take).ToList();
    }

    private static int _refCounter = 0;
    private static string GenerateReference()
    {
        Interlocked.Increment(ref _refCounter);
        return $"3DZ-{DateTime.UtcNow:yyyyMMdd}-{_refCounter:D4}";
    }
}
