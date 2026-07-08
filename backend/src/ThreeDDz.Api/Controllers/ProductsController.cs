using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _svc;
    private readonly IReviewService _reviewSvc;
    private readonly IFavoriteService _favSvc;

    public ProductsController(IProductService svc, IReviewService reviewSvc, IFavoriteService favSvc)
    { _svc = svc; _reviewSvc = reviewSvc; _favSvc = favSvc; }

    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q, [FromQuery] string? categoryId,
        [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
        [FromQuery] int? minRating, [FromQuery] string sort = "newest",
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var skip = (page - 1) * pageSize;
        var (products, totalCount) = await _svc.SearchWithCountAsync(q, categoryId, minPrice, maxPrice, minRating, sort, skip, pageSize);
        var result = await MapProductsAsync(products);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return Ok(new { items = result, totalCount, page, pageSize, totalPages });
    }

    [HttpGet("featured")]
    public async Task<IActionResult> Featured([FromQuery] int take = 8)
    {
        var products = await _svc.GetFeaturedAsync(take);
        return Ok(new { items = await MapProductsAsync(products) });
    }

    [HttpGet("newest")]
    public async Task<IActionResult> Newest([FromQuery] int take = 8)
    {
        var products = await _svc.GetNewestAsync(take);
        return Ok(new { items = await MapProductsAsync(products) });
    }

    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> GetBySlug(string slug)
    {
        var p = await _svc.GetBySlugAsync(slug);
        if (p == null || p.IsDeleted || !p.IsPublished) return NotFound();
        var reviews = await _reviewSvc.GetForProductAsync(p.Id);
        var isFav = false;
        if (User.Identity?.IsAuthenticated == true)
        {
            var uid = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
            isFav = await _favSvc.IsFavoriteAsync(uid, p.Id);
        }
        var related = await _svc.GetRelatedAsync(p.Id);
        return Ok(new
        {
            product = MapProduct(p),
            reviews = reviews.Select(MapReview),
            avgRating = reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 1) : 0,
            reviewCount = reviews.Count,
            isFavorite = isFav,
            related = related.Select(MapProduct)
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var p = await _svc.GetByIdAsync(id);
        if (p == null || p.IsDeleted || !p.IsPublished) return NotFound();
        var reviews = await _reviewSvc.GetForProductAsync(id);
        var isFav = false;
        if (User.Identity?.IsAuthenticated == true)
        {
            var uid = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
            isFav = await _favSvc.IsFavoriteAsync(uid, id);
        }
        var related = await _svc.GetRelatedAsync(id);
        return Ok(new
        {
            product = MapProduct(p),
            reviews = reviews.Select(MapReview),
            avgRating = reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 1) : 0,
            reviewCount = reviews.Count,
            isFavorite = isFav,
            related = related.Select(MapProduct)
        });
    }

    [HttpGet("{id}/related")]
    public async Task<IActionResult> Related(string id, [FromQuery] int take = 4)
    {
        var products = await _svc.GetRelatedAsync(id, take);
        return Ok(new { items = await MapProductsAsync(products) });
    }

    // Admin
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        var created = await _svc.CreateAsync(product);
        return Ok(MapProduct(created));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] Product product)
    {
        var updated = await _svc.UpdateAsync(id, product);
        return Ok(MapProduct(updated));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> SoftDelete(string id)
    {
        await _svc.SoftDeleteAsync(id);
        return Ok(new { message = "Product deleted" });
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/featured")]
    public async Task<IActionResult> ToggleFeatured(string id)
    {
        await _svc.ToggleFeaturedAsync(id);
        return Ok(new { message = "Toggled" });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var all = await _svc.GetNewestAsync(1000);
        return Ok(new { items = all.Select(MapProduct) });
    }

    private async Task<List<object>> MapProductsAsync(List<Product> products)
    {
        return products.Select(MapProduct).ToList();
    }

    private static object MapProduct(Product p) => new
    {
        p.Id, p.Slug, Name = p.Name, Description = p.Description,
        p.Price, EffectivePrice = p.EffectivePrice, p.Currency,
        p.DiscountPercent, p.DiscountStart, p.DiscountEnd,
        p.CategoryId, p.CollectionIds, p.Images, p.FileFormats,
        p.FileSizeMb, p.License, p.IsFeatured, p.IsPublished,
        p.IsDeleted, p.CreatedAt, p.AvgRating, p.ReviewCount
    };

    private static object MapReview(Review r) => new
    {
        r.Id, r.Rating, r.Comment, r.CustomerName, r.CreatedAt
    };
}
