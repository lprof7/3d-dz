using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class Collection
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

    [BsonElement("categoryIds")]
    public List<string> CategoryIds { get; set; } = new();

    [BsonElement("imageUrl")]
    public string? ImageUrl { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
