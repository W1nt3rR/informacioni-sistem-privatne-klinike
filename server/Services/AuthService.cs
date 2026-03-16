using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using PrivateClinic.API.DTOs.Auth;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Services;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RefreshTokenAsync(string refreshToken);
    Task RegisterAsync(RegisterRequest request);
    Task ChangePasswordAsync(string userId, ChangePasswordRequest request);
}

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public AuthService(UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByNameAsync(request.UserName);
        if (user is null || !user.Aktivan)
            throw new UnauthorizedAccessException("Neispravno korisničko ime ili lozinka.");

        var valid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!valid)
            throw new UnauthorizedAccessException("Neispravno korisničko ime ili lozinka.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            _config.GetValue<int>("JwtSettings:RefreshTokenExpirationDays"));
        await _userManager.UpdateAsync(user);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Expiration = DateTime.UtcNow.AddMinutes(
                _config.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes")),
            User = new UserInfo
            {
                Id = user.Id,
                UserName = user.UserName!,
                Ime = user.Ime,
                Prezime = user.Prezime,
                Roles = roles.ToList()
            }
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(string refreshToken)
    {
        var users = _userManager.Users
            .Where(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiryTime > DateTime.UtcNow);
        var user = users.FirstOrDefault();

        if (user is null)
            throw new UnauthorizedAccessException("Nevažeći refresh token.");

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = GenerateAccessToken(user, roles);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(
            _config.GetValue<int>("JwtSettings:RefreshTokenExpirationDays"));
        await _userManager.UpdateAsync(user);

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            Expiration = DateTime.UtcNow.AddMinutes(
                _config.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes")),
            User = new UserInfo
            {
                Id = user.Id,
                UserName = user.UserName!,
                Ime = user.Ime,
                Prezime = user.Prezime,
                Roles = roles.ToList()
            }
        };
    }

    public async Task RegisterAsync(RegisterRequest request)
    {
        string[] validRoles = ["admin", "recepcija", "lekar", "menadzer", "pacijent"];
        if (!validRoles.Contains(request.Role))
            throw new ArgumentException($"Nepoznata uloga: {request.Role}");

        var user = new ApplicationUser
        {
            UserName = request.UserName,
            Email = request.Email,
            Ime = request.Ime,
            Prezime = request.Prezime
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join("; ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, request.Role);
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new ArgumentException("Korisnik nije pronađen.");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw new ArgumentException(string.Join("; ", result.Errors.Select(e => e.Description)));
    }

    private string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName!),
            new("ime", user.Ime),
            new("prezime", user.Prezime)
        };
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                _config.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes")),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }
}
