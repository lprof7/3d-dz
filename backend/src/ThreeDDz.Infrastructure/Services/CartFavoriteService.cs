using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly ICartRepository _cartRepo;
    private readonly IProductRepository _productRepo;

    public CartService(ICartRepository cartRepo, IProductRepository productRepo)
    {
        _cartRepo = cartRepo;
        _productRepo = productRepo;
    }

    public async Task<Cart> GetAsync(string customerId)
    {
        var cart = await _cartRepo.GetByCustomerAsync(customerId);
        if (cart == null)
        {
            cart = new Cart { CustomerId = customerId };
            await _cartRepo.InsertAsync(cart);
        }
        return cart;
    }

    public async Task AddAsync(string customerId, string productId, int qty)
    {
        var cart = await GetAsync(customerId);
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (existing != null)
            existing.Quantity += qty;
        else
            cart.Items.Add(new CartItem { ProductId = productId, Quantity = qty });
        cart.UpdatedAt = DateTime.UtcNow;
        await _cartRepo.UpdateAsync(cart.Id, cart);
    }

    public async Task UpdateQtyAsync(string customerId, string productId, int qty)
    {
        var cart = await GetAsync(customerId);
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null) return;
        if (qty <= 0)
            cart.Items.Remove(item);
        else
            item.Quantity = qty;
        cart.UpdatedAt = DateTime.UtcNow;
        await _cartRepo.UpdateAsync(cart.Id, cart);
    }

    public async Task RemoveAsync(string customerId, string productId)
    {
        var cart = await GetAsync(customerId);
        cart.Items.RemoveAll(i => i.ProductId == productId);
        cart.UpdatedAt = DateTime.UtcNow;
        await _cartRepo.UpdateAsync(cart.Id, cart);
    }

    public async Task ClearAsync(string customerId)
    {
        var cart = await GetAsync(customerId);
        cart.Items.Clear();
        cart.UpdatedAt = DateTime.UtcNow;
        await _cartRepo.UpdateAsync(cart.Id, cart);
    }

    public async Task<List<Product>> GetProductsAsync(string customerId)
    {
        var cart = await GetAsync(customerId);
        var products = new List<Product>();
        foreach (var item in cart.Items)
        {
            var p = await _productRepo.GetByIdAsync(item.ProductId);
            if (p != null && !p.IsDeleted) products.Add(p);
        }
        return products;
    }
}

public class FavoriteService : IFavoriteService
{
    private readonly IFavoriteRepository _favRepo;
    private readonly IProductRepository _productRepo;

    public FavoriteService(IFavoriteRepository favRepo, IProductRepository productRepo)
    {
        _favRepo = favRepo;
        _productRepo = productRepo;
    }

    public async Task ToggleAsync(string customerId, string productId)
    {
        var existing = await _favRepo.GetByCustomerAndProductAsync(customerId, productId);
        if (existing != null)
            await _favRepo.DeleteAsync(existing.Id);
        else
            await _favRepo.InsertAsync(new Favorite { CustomerId = customerId, ProductId = productId });
    }

    public async Task<List<Product>> GetMyFavoritesAsync(string customerId)
    {
        var favs = await _favRepo.GetByCustomerAsync(customerId);
        var products = new List<Product>();
        foreach (var f in favs)
        {
            var p = await _productRepo.GetByIdAsync(f.ProductId);
            if (p != null && !p.IsDeleted) products.Add(p);
        }
        return products;
    }

    public async Task<bool> IsFavoriteAsync(string customerId, string productId) =>
        await _favRepo.GetByCustomerAndProductAsync(customerId, productId) != null;
}
