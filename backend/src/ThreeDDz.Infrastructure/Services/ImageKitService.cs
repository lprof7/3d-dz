using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Infrastructure.Services;

public class ImageKitService : IImageKitService, IFileStorageService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ImageKitService> _logger;
    private string GetConfig(string key) => _config[$"IMAGEKIT_{key}"] ?? _config[$"ImageKit:{key}"] ?? _config[$"ImageKit:{key.Replace("_", "")}"] ?? string.Empty;
    public string PublicKey => GetConfig("PUBLIC_KEY");

    public ImageKitService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<ImageKitService> logger)
    {
        _config = config;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string folder = "3d-dz")
    {
        var privateKey = GetConfig("PRIVATE_KEY");
        var urlEndpoint = GetConfig("URL_ENDPOINT");
        if (string.IsNullOrWhiteSpace(privateKey) || string.IsNullOrWhiteSpace(urlEndpoint))
        {
            _logger.LogError("ImageKit not configured: missing PrivateKey or UrlEndpoint");
            return string.Empty;
        }

        using var client = _httpClientFactory.CreateClient("ImageKit");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue(
            "Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{privateKey}:")));

        using var form = new MultipartFormDataContent();
        form.Add(new StreamContent(stream), "file", fileName);
        form.Add(new StringContent(folder), "folder");
        form.Add(new StringContent("true"), "useUniqueFileName");
        form.Add(new StringContent(fileName), "fileName");

        try
        {
            var response = await client.PostAsync("https://upload.imagekit.io/api/v1/files/upload", form);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError("ImageKit upload failed: {StatusCode} {Body}", response.StatusCode, body);
                return string.Empty;
            }

            var json = await response.Content.ReadAsStringAsync();
            var doc = System.Text.Json.JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("url").GetString() ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImageKit upload exception");
            return string.Empty;
        }
    }

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType)
    {
        return await UploadFileAsync(stream, fileName, "3d-dz");
    }

    public Task DeleteAsync(string url)
    {
        _logger.LogInformation("ImageKit delete skipped (no-op): {Url}", url);
        return Task.CompletedTask;
    }
}
