using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IImageKitService _img;

    public UploadController(IImageKitService img) { _img = img; }

    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        using var stream = file.OpenReadStream();
        var url = await _img.UploadFileAsync(stream, file.FileName);

        if (string.IsNullOrWhiteSpace(url))
            return StatusCode(500, new { error = "Upload failed" });

        return Ok(new { url });
    }
}
