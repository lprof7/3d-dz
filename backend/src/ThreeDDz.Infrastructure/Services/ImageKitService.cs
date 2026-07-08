using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Infrastructure.Services;

public class ImageKitService : IImageKitService
{
    private readonly IConfiguration _config;
    public string PublicKey => _config["IMAGEKIT_PUBLIC_KEY"] ?? string.Empty;

    public ImageKitService(IConfiguration config) { _config = config; }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string folder = "3d-dz")
    {
        var privateKey = _config["IMAGEKIT_PRIVATE_KEY"];
        var urlEndpoint = _config["IMAGEKIT_URL_ENDPOINT"];
        if (string.IsNullOrWhiteSpace(privateKey) || string.IsNullOrWhiteSpace(urlEndpoint))
            return string.Empty;

        using var client = new HttpClient();
        using var form = new MultipartFormDataContent();
        form.Add(new StreamContent(stream), "file", fileName);
        form.Add(new StringContent(folder), "folder");
        form.Add(new StringContent(PublicKey), "publicKey");
        var (token, signature) = GenerateSignature(privateKey);
        form.Add(new StringContent(token), "token");
        form.Add(new StringContent(signature), "signature");
        form.Add(new StringContent(DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()), "timestamp");

        var response = await client.PostAsync("https://upload.imagekit.io/api/v1/files/upload", form);
        if (!response.IsSuccessStatusCode) return string.Empty;

        var json = await response.Content.ReadAsStringAsync();
        var doc = System.Text.Json.JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("url").GetString() ?? string.Empty;
    }

    private static (string token, string signature) GenerateSignature(string privateKey)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var token = Guid.NewGuid().ToString("N");
        var str = token + timestamp;
        using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(privateKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(str));
        var signature = Convert.ToHexString(hash).ToLowerInvariant();
        return (token, signature);
    }
}
