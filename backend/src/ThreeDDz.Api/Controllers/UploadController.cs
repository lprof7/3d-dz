using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IFileStorageService _storage;

    public UploadController(IFileStorageService storage) { _storage = storage; }

    [HttpPost]
    [RequestSizeLimit(200 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        using var stream = file.OpenReadStream();
        var url = await _storage.UploadAsync(stream, file.FileName, file.ContentType);

        if (string.IsNullOrWhiteSpace(url))
            return StatusCode(500, new { error = "Upload failed" });

        return Ok(new { url });
    }
}
