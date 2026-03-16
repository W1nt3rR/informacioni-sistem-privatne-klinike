using Microsoft.AspNetCore.Identity;

namespace PrivateClinic.API.Models;

public class ApplicationUser : IdentityUser
{
    public string Ime { get; set; } = string.Empty;
    public string Prezime { get; set; } = string.Empty;
    public bool Aktivan { get; set; } = true;
    public DateTime DatumKreiranja { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation
    public Doctor? Doctor { get; set; }
    public ICollection<Appointment> CreatedAppointments { get; set; } = [];
    public ICollection<ActivityLog> ActivityLogs { get; set; } = [];
}
