using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("slug")]
    public string Slug { get; set; } = string.Empty;

    [BsonElement("name")]
    public LocalizedString Name { get; set; } = new();

    [BsonElement("description")]
    public LocalizedString Description { get; set; } = new();

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "DZD";

    [BsonElement("discountPercent")]
    public decimal? DiscountPercent { get; set; }

    [BsonElement("discountStart")]
    public DateTime? DiscountStart { get; set; }

    [BsonElement("discountEnd")]
    public DateTime? DiscountEnd { get; set; }

    [BsonElement("categoryId")]
    public string CategoryId { get; set; } = string.Empty;

    [BsonElement("collectionIds")]
    public List<string> CollectionIds { get; set; } = new();

    [BsonElement("images")]
    public List<string> Images { get; set; } = new();

    [BsonElement("fileFormats")]
    public List<string> FileFormats { get; set; } = new();

    [BsonElement("fileSizeMb")]
    public decimal? FileSizeMb { get; set; }

    [BsonElement("license")]
    public string License { get; set; } = "Personal Use";

    [BsonElement("isFeatured")]
    public bool IsFeatured { get; set; }

    [BsonElement("isPublished")]
    public bool IsPublished { get; set; } = true;

    [BsonElement("isDeleted")]
    public bool IsDeleted { get; set; } = false;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public decimal EffectivePrice
    {
        get
        {
            var now = DateTime.UtcNow;
            if (!DiscountPercent.HasValue) return Price;
            var inRange = (!DiscountStart.HasValue || now >= DiscountStart.Value)
                && (!DiscountEnd.HasValue || now <= DiscountEnd.Value);
            if (!inRange) return Price;
            return Math.Round(Price * (1 - DiscountPercent.Value / 100m), 2);
        }
    }
}
