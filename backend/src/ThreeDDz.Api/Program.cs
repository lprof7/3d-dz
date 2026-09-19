using System.Text;
using System.Text.Json;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;
using ThreeDDz.Infrastructure.Repositories;
using ThreeDDz.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// MongoDB
var connString = Environment.GetEnvironmentVariable("MONGODB_CONNECTION") ?? "mongodb://localhost:27017";
var dbName = Environment.GetEnvironmentVariable("MONGODB_DB") ?? "3d-dz";
// TEMP diagnostics: reveal whether the variable actually reaches the process
// and whether it looks like a valid mongodb(+srv) URI (prefix masked, no secrets).
Console.Error.WriteLine($"[env] MONGODB_CONNECTION set={!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("MONGODB_CONNECTION"))} prefix={(connString.Length >= 21 ? connString[..21] : connString)}");
Console.Error.WriteLine($"[env] MONGODB_DB={dbName}");
var mongo = new MongoContext(connString, dbName);
builder.Services.AddSingleton(mongo);

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<ICollectionRepository, CollectionRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IBannerRepository, BannerRepository>();
builder.Services.AddScoped<IWilayaRepository, WilayaRepository>();

// Services
builder.Services.AddScoped<IImageKitService, ImageKitService>();
builder.Services.AddScoped<IFileStorageService, ImageKitService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<ICollectionService, CollectionService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IBannerService, BannerService>();
builder.Services.AddScoped<IWilayaService, WilayaService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddHttpClient();

// FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<ThreeDDz.Api.Validators.RegisterRequestValidator>();

// JWT Auth
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "default-secret-change-me-32-chars-min!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "3d-dz",
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "3d-dz",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// OpenApi disabled due to .NET 10 preview compatibility
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    o.JsonSerializerOptions.Converters.Add(new ThreeDDz.Domain.Models.LocalizedStringConverter());
});
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// Seed data & indexes — must not block/stop startup when MongoDB is briefly
// unreachable. Run it, but swallow failures so Kestrel still starts and
// returns a fast HTTP error instead of a never-terminating 502.5 startup.
// (Only network calls that respect the MongoClient timeouts run here.)
try
{
    using (var scope = app.Services.CreateScope())
    {
        var sp = scope.ServiceProvider;
        await ThreeDDz.Api.Seed.SeedData.SeedAsync(sp);
        await ThreeDDz.Api.Seed.SeedData.EnsureIndexesAsync(sp, mongo);
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[seed] MongoDB unavailable at startup: {ex.Message}");
}

// Development-only middleware (OpenApi disabled for .NET 10 preview)

// Diagnostics: expose exception details ONLY when explicitly enabled via
// SHOW_ERROR_DETAILS=1. Production responses stay clean by default.
if (Environment.GetEnvironmentVariable("SHOW_ERROR_DETAILS") == "1")
{
    var dbgConn = Environment.GetEnvironmentVariable("MONGODB_CONNECTION");
    app.Use(async (ctx, next) =>
    {
        try { await next(); }
        catch (Exception ex)
        {
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/json";
            var prefix = dbgConn is { Length: > 21 } ? dbgConn[..21] : dbgConn ?? "";
            await ctx.Response.WriteAsJsonAsync(new
            {
                error = ex.Message,
                type = ex.GetType().FullName,
                mongodb_conn_set = !string.IsNullOrEmpty(dbgConn),
                mongodb_conn_prefix = prefix
            });
        }
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
