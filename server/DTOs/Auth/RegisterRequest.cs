using System.ComponentModel.DataAnnotations;

namespace PrivateClinic.API.DTOs.Auth;

public class RegisterRequest
{
    [Required, MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Ime { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Prezime { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;
}
