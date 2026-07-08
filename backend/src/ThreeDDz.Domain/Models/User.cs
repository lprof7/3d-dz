using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using ThreeDDz.Domain.Enums;

namespace ThreeDDz.Domain.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("fullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("phone")]
    public string? Phone { get; set; }

    [BsonElement("wilayaCode")]
    public int? WilayaCode { get; set; }

    [BsonElement("role")]
    public UserRole Role { get; set; } = UserRole.Customer;

    [BsonElement("isBanned")]
    public bool IsBanned { get; set; } = false;

    [BsonElement("preferredLang")]
    public string PreferredLang { get; set; } = "ar";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("passwordResetToken")]
    public string? PasswordResetToken { get; set; }

    [BsonElement("passwordResetExpires")]
    public DateTime? PasswordResetExpires { get; set; }
}
