using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class Wilaya
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("code")]
    public int Code { get; set; }

    [BsonElement("name")]
    public LocalizedString Name { get; set; } = new();
}
