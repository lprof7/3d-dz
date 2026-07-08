using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class Banner
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("title")]
    public LocalizedString Title { get; set; } = new();

    [BsonElement("subtitle")]
    public LocalizedString Subtitle { get; set; } = new();

    [BsonElement("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [BsonElement("linkUrl")]
    public string? LinkUrl { get; set; }

    [BsonElement("ctaText")]
    public LocalizedString CtaText { get; set; } = new();

    [BsonElement("sortOrder")]
    public int SortOrder { get; set; } = 0;

    [BsonElement("active")]
    public bool Active { get; set; } = true;

    [BsonElement("startAt")]
    public DateTime? StartAt { get; set; }

    [BsonElement("endAt")]
    public DateTime? EndAt { get; set; }
}
