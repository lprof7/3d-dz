using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Controllers;

[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _svc;
    private string UserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
    private string UserName => User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value ?? "";

    public ReviewsController(IReviewService svc) { _svc = svc; }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitReviewReq r)
    {
        try
        {
            var review = await _svc.SubmitOrUpdateAsync(UserId, UserName, r.ProductId, r.OrderId, r.Rating, r.Comment);
            return Ok(review);
        }
        catch (InvalidOperationException e) { return BadRequest(new { error = e.Message }); }
    }

    [HttpGet("product/{productId}")]
    public async Task<IActionResult> ForProduct(string productId)
    {
        var reviews = await _svc.GetForProductAsync(productId);
        return Ok(new { items = reviews });
    }
}

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IOrderService _orderSvc;
    private readonly IReviewService _reviewSvc;
    private readonly IUserRepository _userRepo;
    private readonly IProductRepository _productRepo;
    private readonly IAnalyticsService _analytics;
    private string AdminId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";

    public AdminController(IOrderService orderSvc, IReviewService reviewSvc,
        IUserRepository userRepo, IProductRepository productRepo, IAnalyticsService analytics)
    {
        _orderSvc = orderSvc; _reviewSvc = reviewSvc;
        _userRepo = userRepo; _productRepo = productRepo; _analytics = analytics;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? status, [FromQuery] int? wilayaCode,
        [FromQuery] string? search, [FromQuery] int page = 1, int pageSize = 50)
    {
        var filter = new OrderFilter
        {
            Search = search,
            WilayaCode = wilayaCode,
            Skip = (page - 1) * pageSize,
            Take = pageSize
        };
        if (Enum.TryParse<OrderStatus>(status, true, out var s))
            filter.Status = s;
        var orders = await _orderSvc.GetByFilterAsync(filter);
        return Ok(new { items = orders, page, pageSize });
    }

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> ChangeStatus(string id, [FromBody] StatusReq r)
    {
        var order = await _orderSvc.ChangeStatusAsync(id, r.Status, AdminId);
        return Ok(order);
    }

    [HttpPost("orders/{id}/notes")]
    public async Task<IActionResult> AddNote(string id, [FromBody] NoteReq r)
    {
        var order = await _orderSvc.AddInternalNoteAsync(id, r.Text, AdminId);
        return Ok(order);
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrder(string id)
    {
        var order = await _orderSvc.GetByIdAsync(id);
        return order == null ? NotFound() : Ok(order);
    }

    [HttpGet("customers")]
    public async Task<IActionResult> GetCustomers()
    {
        var users = await _userRepo.GetAllAsync();
        var customers = users.Where(u => u.Role == UserRole.Customer).ToList();
        return Ok(new { items = customers });
    }

    [HttpPatch("customers/{id}/ban")]
    public async Task<IActionResult> ToggleBan(string id)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) return NotFound();
        user.IsBanned = !user.IsBanned;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(id, user);
        return Ok(new { isBanned = user.IsBanned });
    }

    [HttpGet("reviews/pending")]
    public async Task<IActionResult> PendingReviews() =>
        Ok(new { items = await _reviewSvc.GetPendingAsync() });

    [HttpPut("reviews/{id}/status")]
    public async Task<IActionResult> ReviewStatus(string id, [FromBody] StatusReq r)
    {
        var review = await _reviewSvc.ChangeStatusAsync(id, r.Status);
        return Ok(review);
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics([FromQuery] DateTime? from, [FromQuery] DateTime? to) =>
        Ok(await _analytics.GetAsync(from, to));

    [HttpGet("products")]
    public async Task<IActionResult> AllProducts()
    {
        var all = await _productRepo.GetAllAsync();
        return Ok(new { items = all });
    }
}

public record StatusReq(int Status);
public record NoteReq(string Text);
public record SubmitReviewReq(string ProductId, string? OrderId, int Rating, string Comment);
