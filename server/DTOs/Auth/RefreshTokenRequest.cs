using System.ComponentModel.DataAnnotations;

namespace PrivateClinic.API.DTOs.Auth;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
