using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ThreeDDz.Domain.Models;

public class LocalizedString
{
    [BsonElement("ar")]
    public string Ar { get; set; } = string.Empty;

    [BsonElement("fr")]
    public string Fr { get; set; } = string.Empty;

    [BsonElement("en")]
    public string En { get; set; } = string.Empty;

    public LocalizedString() { }

    public LocalizedString(string ar, string fr, string en)
    {
        Ar = ar;
        Fr = fr;
        En = en;
    }

    public string Get(string lang) => lang switch
    {
        "ar" => Ar,
        "fr" => Fr,
        _ => En
    };

    public bool HasAny() => !string.IsNullOrWhiteSpace(Ar)
        || !string.IsNullOrWhiteSpace(Fr)
        || !string.IsNullOrWhiteSpace(En);
}
