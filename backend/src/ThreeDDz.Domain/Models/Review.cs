using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ThreeDDz.Domain.Enums;

namespace ThreeDDz.Domain.Models;

public class Review
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("productId")]
    public string ProductId { get; set; } = string.Empty;

    [BsonElement("customerId")]
    public string CustomerId { get; set; } = string.Empty;

    [BsonElement("customerName")]
    public string CustomerName { get; set; } = string.Empty;

    [BsonElement("rating")]
    public int Rating { get; set; }

    [BsonElement("comment")]
    public string Comment { get; set; } = string.Empty;

    [BsonElement("status")]
    public ReviewStatus Status { get; set; } = ReviewStatus.PendingApproval;

    [BsonElement("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
