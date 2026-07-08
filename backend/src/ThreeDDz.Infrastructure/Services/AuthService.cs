using System.Security.Cryptography;
using System.Text;
using ThreeDDz.Application.Interfaces;
using ThreeDDz.Domain.Enums;
using ThreeDDz.Domain.Models;

namespace ThreeDDz.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly JwtService _jwt;

    public AuthService(IUserRepository userRepo, JwtService jwt)
    {
        _userRepo = userRepo;
        _jwt = jwt;
    }

    public async Task<(User user, string token)> RegisterAsync(string fullName, string email, string password, string? phone)
    {
        var existing = await _userRepo.GetByEmailAsync(email);
        if (existing != null)
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            FullName = fullName,
            Email = email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Phone = phone,
            Role = UserRole.Customer
        };
        await _userRepo.InsertAsync(user);
        var token = _jwt.GenerateToken(user.Id, user.Email, user.Role.ToString(), user.FullName);
        return (user, token);
    }

    public async Task<(User user, string token)> LoginAsync(string email, string password)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password");

        if (user.IsBanned)
            throw new UnauthorizedAccessException("This account has been suspended. Please contact support.");

        var token = _jwt.GenerateToken(user.Id, user.Email, user.Role.ToString(), user.FullName);
        return (user, token);
    }

    public async Task RequestPasswordResetAsync(string email)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        if (user == null) return;

        user.PasswordResetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetExpires = DateTime.UtcNow.AddMinutes(30);
        await _userRepo.UpdateAsync(user.Id, user);
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == token && u.PasswordResetExpires > DateTime.UtcNow);
        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpires = null;
        await _userRepo.UpdateAsync(user.Id, user);
        return true;
    }

    public async Task<User?> GetByIdAsync(string userId) =>
        await _userRepo.GetByIdAsync(userId);

    public async Task<User> UpdateProfileAsync(string userId, string? fullName, string? phone)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new InvalidOperationException("User not found");
        if (fullName != null) user.FullName = fullName;
        if (phone != null) user.Phone = phone;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(userId, user);
        return user;
    }
}
