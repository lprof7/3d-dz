using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class Category
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

    [BsonElement("iconUrl")]
    public string? IconUrl { get; set; }

    [BsonElement("sortOrder")]
    public int SortOrder { get; set; } = 0;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
