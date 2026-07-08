using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepo;
    private readonly ITranslationService _translation;
    private static readonly Random _rng = new();

    public ProductService(IProductRepository productRepo, ITranslationService translation)
    {
        _productRepo = productRepo;
        _translation = translation;
    }

    public async Task<Product> CreateAsync(Product product)
    {
        product.Slug = GenerateSlug(product.Name.Ar.Length > 0 ? product.Name.Ar : product.Name.En);
        product.CreatedAt = DateTime.UtcNow;
        product.UpdatedAt = DateTime.UtcNow;
        product.Name = await _translation.EnsureAllLanguagesAsync(product.Name, "ar");
        product.Description = await _translation.EnsureAllLanguagesAsync(product.Description, "ar");
        await _productRepo.InsertAsync(product);
        return product;
    }

    public async Task<Product> UpdateAsync(string id, Product product)
    {
        product.Id = id;
        product.UpdatedAt = DateTime.UtcNow;
        await _productRepo.UpdateAsync(id, product);
        return product;
    }

    public async Task SoftDeleteAsync(string id)
    {
        var p = await _productRepo.GetByIdAsync(id);
        if (p == null) return;
        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        await _productRepo.UpdateAsync(id, p);
    }

    public async Task ToggleFeaturedAsync(string id)
    {
        var p = await _productRepo.GetByIdAsync(id);
        if (p == null) return;
        p.IsFeatured = !p.IsFeatured;
        p.UpdatedAt = DateTime.UtcNow;
        await _productRepo.UpdateAsync(id, p);
    }

    public Task<List<Product>> SearchAsync(string? text, string? categoryId, decimal? minPrice, decimal? maxPrice, int? minRating, string sort, int skip, int take) =>
        _productRepo.SearchAsync(text, categoryId, minPrice, maxPrice, minRating, sort, skip, take);

    public async Task<Product?> GetByIdAsync(string id) => await _productRepo.GetByIdAsync(id);

    public Task<Product?> GetBySlugAsync(string slug) => _productRepo.FirstOrDefaultAsync(p => p.Slug == slug);


    public Task<List<Product>> GetFeaturedAsync(int take = 8) => _productRepo.GetFeaturedAsync(take);

    public Task<List<Product>> GetNewestAsync(int take = 8) => _productRepo.GetNewestAsync(take);

    public Task<List<Product>> GetRelatedAsync(string productId, int take = 4)
    {
        return _productRepo.GetByIdAsync(productId).ContinueWith(t =>
        {
            var product = t.Result;
            if (product == null) return Task.FromResult(new List<Product>());
            return _productRepo.GetRelatedAsync(productId, product.CategoryId, take);
        }).Unwrap();
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug += $"-{_rng.Next(10000, 99999)}";
        return slug;
    }
}
