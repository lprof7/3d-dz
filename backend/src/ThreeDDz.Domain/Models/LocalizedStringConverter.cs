using System.Text.Json;
using System.Text.Json.Serialization;

namespace ThreeDDz.Domain.Models;

public class LocalizedStringConverter : JsonConverter<LocalizedString>
{
    public override LocalizedString Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
            return new LocalizedString("", reader.GetString() ?? "", "");
        var doc = JsonDocument.ParseValue(ref reader);
        var root = doc.RootElement;
        return new LocalizedString(
            root.TryGetProperty("ar", out var a) ? a.GetString() ?? "" : "",
            root.TryGetProperty("fr", out var f) ? f.GetString() ?? "" : "",
            root.TryGetProperty("en", out var e) ? e.GetString() ?? "" : ""
        );
    }

    public override void Write(Utf8JsonWriter writer, LocalizedString value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("ar", value.Ar ?? "");
        writer.WriteString("fr", value.Fr ?? "");
        writer.WriteString("en", value.En ?? "");
        writer.WriteEndObject();
    }
}
