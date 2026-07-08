using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) { _auth = auth; }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest r)
    {
        try
        {
            var (user, token) = await _auth.RegisterAsync(r.FullName, r.Email, r.Password, r.Phone);
            return Ok(new { token, user = MapUser(user) });
        }
        catch (InvalidOperationException e) { return BadRequest(new { error = e.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest r)
    {
        try
        {
            var (user, token) = await _auth.LoginAsync(r.Email, r.Password);
            return Ok(new { token, user = MapUser(user) });
        }
        catch (UnauthorizedAccessException e) { return Unauthorized(new { error = e.Message }); }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotRequest r)
    {
        await _auth.RequestPasswordResetAsync(r.Email);
        return Ok(new { message = "If this email is registered, you will receive a reset link." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetRequest r)
    {
        var ok = await _auth.ResetPasswordAsync(r.Token, r.NewPassword);
        return ok ? Ok(new { message = "Password reset successfully" })
                  : BadRequest(new { error = "Invalid or expired token" });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateRequest r)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        try
        {
            var user = await _auth.UpdateProfileAsync(userId, r.FullName, r.Phone, r.WilayaCode);
            return Ok(new { user = MapUser(user) });
        }
        catch (InvalidOperationException e) { return BadRequest(new { error = e.Message }); }
    }

    [Authorize]
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest r)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        try
        {
            await _auth.ChangePasswordAsync(userId, r.CurrentPassword, r.NewPassword);
            return Ok(new { message = "Password changed" });
        }
        catch (InvalidOperationException e) { return BadRequest(new { error = e.Message }); }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var user = await _auth.GetByIdAsync(userId);
        if (user == null) return NotFound();
        return Ok(new { user = MapUser(user) });
    }

    private static object MapUser(User u) => new
    {
        u.Id, u.FullName, u.Email, u.Phone, u.WilayaCode, u.PreferredLang,
        Role = u.Role.ToString(), u.IsBanned, u.CreatedAt
    };
}

public record RegisterRequest(string FullName, string Email, string Password, string? Phone);
public record LoginRequest(string Email, string Password);
public record ForgotRequest(string Email);
public record ResetRequest(string Token, string NewPassword);
public record ProfileUpdateRequest(string? FullName, string? Phone, int? WilayaCode);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
