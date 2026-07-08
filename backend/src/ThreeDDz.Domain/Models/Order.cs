using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ThreeDDz.Domain.Enums;

namespace ThreeDDz.Domain.Models;

public class OrderItem
{
    [BsonElement("productId")]
    public string ProductId { get; set; } = string.Empty;

    [BsonElement("productName")]
    public LocalizedString ProductName { get; set; } = new();

    [BsonElement("unitPrice")]
    public decimal UnitPrice { get; set; }

    [BsonElement("quantity")]
    public int Quantity { get; set; } = 1;

    [BsonElement("lineTotal")]
    public decimal LineTotal => UnitPrice * Quantity;
}

public class OrderNote
{
    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("adminId")]
    public string AdminId { get; set; } = string.Empty;
}

public class Order
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("reference")]
    public string Reference { get; set; } = string.Empty;

    [BsonElement("customerId")]
    public string? CustomerId { get; set; }

    [BsonElement("customerFullName")]
    public string CustomerFullName { get; set; } = string.Empty;

    [BsonElement("customerPhone")]
    public string CustomerPhone { get; set; } = string.Empty;

    [BsonElement("customerEmail")]
    public string CustomerEmail { get; set; } = string.Empty;

    [BsonElement("wilayaCode")]
    public int WilayaCode { get; set; }

    [BsonElement("wilayaName")]
    public string WilayaName { get; set; } = string.Empty;

    [BsonElement("items")]
    public List<OrderItem> Items { get; set; } = new();

    [BsonElement("subTotal")]
    public decimal SubTotal { get; set; }

    [BsonElement("total")]
    public decimal Total { get; set; }

    [BsonElement("currency")]
    public string Currency { get; set; } = "DZD";

    [BsonElement("status")]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    [BsonElement("statusHistory")]
    public List<OrderNote> StatusHistory { get; set; } = new();

    [BsonElement("internalNotes")]
    public List<OrderNote> InternalNotes { get; set; } = new();

    [BsonElement("publicNote")]
    public string? PublicNote { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
