using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Configuration;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class TranslationService : ITranslationService
{
    private readonly string _baseUrl;
    private readonly HttpClient _http;

    public TranslationService(IConfiguration config, IHttpClientFactory httpFactory)
    {
        _baseUrl = config["LIBRETRANSLATE_URL"] ?? "https://libretranslate.com";
        _http = httpFactory.CreateClient();
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<string> TranslateAsync(string text, string source, string target)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        try
        {
            var payload = new { q = text, source, target, format = "text" };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _http.PostAsync($"{_baseUrl}/translate", content);
            if (!response.IsSuccessStatusCode) return text;
            var result = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(result);
            return doc.RootElement.GetProperty("translatedText").GetString() ?? text;
        }
        catch
        {
            return text; // fallback
        }
    }

    public async Task<LocalizedString> EnsureAllLanguagesAsync(LocalizedString input, string sourceLang)
    {
        // Determine which language we have
        var result = new LocalizedString
        {
            Ar = input.Ar,
            Fr = input.Fr,
            En = input.En
        };

        if (string.IsNullOrWhiteSpace(result.Ar) && sourceLang != "ar")
            result.Ar = await TranslateAsync(result.Get("fr") ?? result.En, sourceLang, "ar");
        if (string.IsNullOrWhiteSpace(result.Fr) && sourceLang != "fr")
            result.Fr = await TranslateAsync(result.Ar.Length > 0 ? result.Ar : result.En, sourceLang, "fr");
        if (string.IsNullOrWhiteSpace(result.En) && sourceLang != "en")
            result.En = await TranslateAsync(result.Ar.Length > 0 ? result.Ar : result.Fr, sourceLang, "en");

        return result;
    }
}
