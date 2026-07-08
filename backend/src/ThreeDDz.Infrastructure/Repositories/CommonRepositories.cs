using MongoDB.Driver;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Repositories;

public class UserRepository : MongoRepository<User>, IUserRepository
{
    public UserRepository(MongoContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email) =>
        await Collection.Find(u => u.Email == email.ToLowerInvariant()).FirstOrDefaultAsync();
}

public class CategoryRepository : MongoRepository<Category>, ICategoryRepository
{
    public CategoryRepository(MongoContext context) : base(context) { }

    public async Task<Category?> GetBySlugAsync(string slug) =>
        await Collection.Find(c => c.Slug == slug).FirstOrDefaultAsync();

    public async Task<bool> HasProductsAsync(string categoryId)
    {
        var products = Context.GetCollection<Product>();
        return await products.Find(p => p.CategoryId == categoryId && !p.IsDeleted).AnyAsync();
    }
}

public class CollectionRepository : MongoRepository<Collection>, ICollectionRepository
{
    public CollectionRepository(MongoContext context) : base(context) { }

    public async Task<Collection?> GetBySlugAsync(string slug) =>
        await Collection.Find(c => c.Slug == slug).FirstOrDefaultAsync();
}

public class BannerRepository : MongoRepository<Banner>, IBannerRepository
{
    public BannerRepository(MongoContext context) : base(context) { }

    public async Task<List<Banner>> GetActiveAsync()
    {
        var now = DateTime.UtcNow;
        var builder = Builders<Banner>.Filter;
        return await Collection.Find(builder.And(
            builder.Eq(b => b.Active, true),
            builder.Or(builder.Exists(b => b.StartAt, false), builder.Lte(b => b.StartAt, now)),
            builder.Or(builder.Exists(b => b.EndAt, false), builder.Gte(b => b.EndAt, now))
        )).SortBy(b => b.SortOrder).ToListAsync();
    }
}

public class WilayaRepository : MongoRepository<Wilaya>, IWilayaRepository
{
    public WilayaRepository(MongoContext context) : base(context) { }

    public async Task<Wilaya?> GetByCodeAsync(int code) =>
        await Collection.Find(w => w.Code == code).FirstOrDefaultAsync();
}
