using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ThreeDDz.Application.Interfaces;

namespace ThreeDDz.Infrastructure.Services;

public class JwtService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtService(IConfiguration config)
    {
        _secret = config["JWT_SECRET"] ?? "default-secret-change-me-in-production-at-least-32-chars!!";
        _issuer = config["JWT_ISSUER"] ?? "3d-dz";
        _audience = config["JWT_AUDIENCE"] ?? "3d-dz";
    }

    public string GenerateToken(string userId, string email, string role, string? fullName = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role)
        };
        if (!string.IsNullOrWhiteSpace(fullName))
            claims.Add(new Claim(ClaimTypes.Name, fullName));
        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
