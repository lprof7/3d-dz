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
    private readonly IFileStorageService _storage;

    public ProductsController(IProductService svc, IReviewService reviewSvc, IFavoriteService favSvc, IFileStorageService storage)
    { _svc = svc; _reviewSvc = reviewSvc; _favSvc = favSvc; _storage = storage; }

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
    [HttpPost("with-files")]
    [RequestSizeLimit(300 * 1024 * 1024)]
    public async Task<IActionResult> CreateWithFiles()
    {
        var productJson = HttpContext.Request.Form["product"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(productJson))
            return BadRequest(new { error = "Product data is required" });

        Product product;
        try { product = System.Text.Json.JsonSerializer.Deserialize<Product>(productJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })!; }
        catch { return BadRequest(new { error = "Invalid product JSON" }); }

        var images = HttpContext.Request.Form.Files.Where(f => f.Name == "images").ToList();
        var modelFile = HttpContext.Request.Form.Files.GetFile("modelFile");

        if (images.Count > 0)
        {
            var urls = new List<string>();
            foreach (var img in images)
            {
                using var stream = img.OpenReadStream();
                var url = await _storage.UploadAsync(stream, img.FileName, img.ContentType);
                if (string.IsNullOrWhiteSpace(url))
                    return StatusCode(500, new { error = "Image upload failed" });
                urls.Add(url);
            }
            product.Images = urls;
        }

        if (modelFile != null)
        {
            using var stream = modelFile.OpenReadStream();
            var url = await _storage.UploadAsync(stream, modelFile.FileName, modelFile.ContentType);
            if (string.IsNullOrWhiteSpace(url))
                return StatusCode(500, new { error = "3D model upload failed" });
            product.ModelUrl = url;
            product.ModelFormat = Path.GetExtension(modelFile.FileName).TrimStart('.').ToLowerInvariant();
        }

        var created = await _svc.CreateAsync(product);
        return Ok(MapProduct(created));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/with-files")]
    [RequestSizeLimit(300 * 1024 * 1024)]
    public async Task<IActionResult> UpdateWithFiles(string id)
    {
        var existing = await _svc.GetByIdAsync(id);
        if (existing == null) return NotFound();

        var productJson = HttpContext.Request.Form["product"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(productJson))
        {
            try
            {
                var updates = System.Text.Json.JsonSerializer.Deserialize<Product>(productJson, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
                existing.Name = updates.Name;
                existing.Description = updates.Description;
                existing.Price = updates.Price;
                existing.DiscountPercent = updates.DiscountPercent;
                existing.DiscountStart = updates.DiscountStart;
                existing.DiscountEnd = updates.DiscountEnd;
                existing.CategoryId = updates.CategoryId;
                existing.CollectionIds = updates.CollectionIds;
                existing.License = updates.License;
                existing.IsFeatured = updates.IsFeatured;
                existing.IsPublished = updates.IsPublished;
                existing.FileFormats = updates.FileFormats;
                existing.FileSizeMb = updates.FileSizeMb;
                existing.Currency = updates.Currency;
                existing.Images = updates.Images ?? existing.Images;
            }
            catch { return BadRequest(new { error = "Invalid product JSON" }); }
        }

        var images = HttpContext.Request.Form.Files.Where(f => f.Name == "images").ToList();
        var modelFile = HttpContext.Request.Form.Files.GetFile("modelFile");

        if (images.Count > 0)
        {
            foreach (var img in images)
            {
                using var stream = img.OpenReadStream();
                var url = await _storage.UploadAsync(stream, img.FileName, img.ContentType);
                if (string.IsNullOrWhiteSpace(url))
                    return StatusCode(500, new { error = "Image upload failed" });
                existing.Images.Add(url);
            }
        }

        if (modelFile != null)
        {
            if (!string.IsNullOrWhiteSpace(existing.ModelUrl))
                await _storage.DeleteAsync(existing.ModelUrl);
            using var stream = modelFile.OpenReadStream();
            var url = await _storage.UploadAsync(stream, modelFile.FileName, modelFile.ContentType);
            if (string.IsNullOrWhiteSpace(url))
                return StatusCode(500, new { error = "3D model upload failed" });
            existing.ModelUrl = url;
            existing.ModelFormat = Path.GetExtension(modelFile.FileName).TrimStart('.').ToLowerInvariant();
        }

        var updated = await _svc.UpdateAsync(id, existing);
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
        var all = await _svc.GetAllAdminAsync();
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
        p.FileSizeMb, p.ModelUrl, p.ModelFormat, p.License, p.IsFeatured, p.IsPublished,
        p.IsDeleted, p.CreatedAt, p.AvgRating, p.ReviewCount
    };

    private static object MapReview(Review r) => new
    {
        r.Id, r.Rating, r.Comment, r.CustomerName, r.CreatedAt
    };
}
