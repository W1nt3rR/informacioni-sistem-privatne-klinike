using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PrivateClinic.API.DTOs.Auth;
using PrivateClinic.API.Services;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(result);
    }

    [HttpPost("register")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        await _authService.RegisterAsync(request);
        return Ok(new { message = "Korisnik uspešno kreiran." });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _authService.ChangePasswordAsync(userId, request);
        return Ok(new { message = "Lozinka uspešno promenjena." });
    }
}
