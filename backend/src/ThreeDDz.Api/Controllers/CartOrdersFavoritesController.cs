using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _svc;
    private string UserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

    public CartController(ICartService svc) { _svc = svc; }

    [HttpGet] public async Task<IActionResult> Get()
    {
        var cart = await _svc.GetAsync(UserId);
        var products = await _svc.GetProductsAsync(UserId);
        var items = cart.Items.Select(i =>
        {
            var p = products.FirstOrDefault(x => x.Id == i.ProductId);
            return new
            {
                i.ProductId,
                i.Quantity,
                price = p?.EffectivePrice ?? 0,
                productName = p?.Name?.Ar ?? p?.Name?.En ?? "",
                imageUrl = p?.Images?.FirstOrDefault() ?? ""
            };
        }).ToList();
        var total = items.Sum(i => i.price * i.Quantity);
        return Ok(new { items, total, itemCount = cart.Items.Sum(i => i.Quantity) });
    }

    [HttpPost("add")] public async Task<IActionResult> Add([FromBody] CartOpReq r)
    {
        await _svc.AddAsync(UserId, r.ProductId, r.Qty ?? 1);
        return Ok(new { message = "Added" });
    }

    [HttpPost("update")] public async Task<IActionResult> Update([FromBody] CartOpReq r)
    {
        await _svc.UpdateQtyAsync(UserId, r.ProductId, r.Qty ?? 1);
        return Ok(new { message = "Updated" });
    }

    [HttpDelete("{productId}")] public async Task<IActionResult> Remove(string productId)
    {
        await _svc.RemoveAsync(UserId, productId);
        return Ok(new { message = "Removed" });
    }

    [HttpPost("clear")] public async Task<IActionResult> Clear()
    {
        await _svc.ClearAsync(UserId);
        return Ok(new { message = "Cleared" });
    }
}

[Authorize]
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _svc;
    private string UserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

    public OrdersController(IOrderService svc) { _svc = svc; }

    [HttpPost("place")]
    public async Task<IActionResult> Place([FromBody] PlaceOrderReq r)
    {
        try
        {
            var order = new Domain.Models.Order
            {
                CustomerFullName = r.FullName,
                CustomerPhone = r.Phone,
                CustomerEmail = r.Email,
                WilayaCode = r.WilayaCode,
                WilayaName = r.WilayaName
            };
            var created = await _svc.PlaceAsync(UserId, order);
            return Ok(new { order = created, message = "Order placed successfully" });
        }
        catch (InvalidOperationException e) { return BadRequest(new { error = e.Message }); }
    }

    [HttpGet("mine")] public async Task<IActionResult> Mine() =>
        Ok(new { items = await _svc.GetMineAsync(UserId) });

    [HttpGet("{id}")] public async Task<IActionResult> GetById(string id)
    {
        var order = await _svc.GetByIdAsync(id);
        if (order == null || order.CustomerId != UserId) return NotFound();
        return Ok(order);
    }
}

[Authorize]
[ApiController]
[Route("api/favorites")]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _svc;
    private string UserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

    public FavoritesController(IFavoriteService svc) { _svc = svc; }

    [HttpGet("{productId}")] public async Task<IActionResult> Check(string productId)
    {
        var isFav = await _svc.IsFavoriteAsync(UserId, productId);
        return Ok(new { isFavorite = isFav });
    }

    [HttpPost("toggle")] public async Task<IActionResult> Toggle([FromBody] CartOpReq r)
    {
        await _svc.ToggleAsync(UserId, r.ProductId);
        var isFav = await _svc.IsFavoriteAsync(UserId, r.ProductId);
        return Ok(new { isFavorite = isFav });
    }

    [HttpGet] public async Task<IActionResult> Get()
    {
        var products = await _svc.GetMyFavoritesAsync(UserId);
        return Ok(new { items = products });
    }
}

public record CartOpReq(string ProductId, int? Qty);
public record PlaceOrderReq(string FullName, string Phone, string Email, int WilayaCode, string WilayaName);
