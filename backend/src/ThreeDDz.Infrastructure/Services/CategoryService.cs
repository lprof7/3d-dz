using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly ICategoryRepository _catRepo;
    private readonly ITranslationService _translation;

    public CategoryService(ICategoryRepository catRepo, ITranslationService translation)
    {
        _catRepo = catRepo;
        _translation = translation;
    }

    public async Task<Category> CreateAsync(Category category)
    {
        category.Slug = category.Name.Ar.Length > 0
            ? category.Name.Ar.ToLowerInvariant().Replace(" ", "-").Replace("ّ", "").Replace("ة", "t")
            : Guid.NewGuid().ToString("N")[..8];
        category.Name = await _translation.EnsureAllLanguagesAsync(category.Name, "ar");
        category.Description = await _translation.EnsureAllLanguagesAsync(category.Description, "ar");
        await _catRepo.InsertAsync(category);
        return category;
    }

    public async Task<Category> UpdateAsync(string id, Category category)
    {
        category.Id = id;
        await _catRepo.UpdateAsync(id, category);
        return category;
    }

    public async Task<bool> CanDeleteAsync(string id) =>
        !await _catRepo.HasProductsAsync(id);

    public async Task<bool> DeleteAsync(string id)
    {
        if (!await CanDeleteAsync(id)) return false;
        await _catRepo.DeleteAsync(id);
        return true;
    }

    public Task<List<Category>> GetAllAsync() => _catRepo.GetAllAsync();
    public Task<Category?> GetBySlugAsync(string slug) => _catRepo.GetBySlugAsync(slug);
    public Task<Category?> GetByIdAsync(string id) => _catRepo.GetByIdAsync(id);
}

public class CollectionService : ICollectionService
{
    private readonly ICollectionRepository _colRepo;
    private readonly IProductRepository _productRepo;
    private readonly ITranslationService _translation;

    public CollectionService(ICollectionRepository colRepo, IProductRepository productRepo, ITranslationService translation)
    {
        _colRepo = colRepo;
        _productRepo = productRepo;
        _translation = translation;
    }

    public async Task<Collection> CreateAsync(Collection collection)
    {
        collection.Name = await _translation.EnsureAllLanguagesAsync(collection.Name, "ar");
        collection.Description = await _translation.EnsureAllLanguagesAsync(collection.Description, "ar");
        await _colRepo.InsertAsync(collection);
        return collection;
    }

    public async Task<Collection> UpdateAsync(string id, Collection collection)
    {
        collection.Id = id;
        await _colRepo.UpdateAsync(id, collection);
        return collection;
    }

    public async Task DeleteAsync(string id) => await _colRepo.DeleteAsync(id);
    public Task<List<Collection>> GetAllAsync() => _colRepo.GetAllAsync();
    public Task<Collection?> GetBySlugAsync(string slug) => _colRepo.GetBySlugAsync(slug);

    public async Task<List<Product>> GetProductsAsync(string collectionId) =>
        await _productRepo.GetByCollectionAsync(collectionId, 0, 100);
}
