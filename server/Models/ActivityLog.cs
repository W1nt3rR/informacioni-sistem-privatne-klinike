namespace PrivateClinic.API.Models;

public class ActivityLog
{
    public int ActivityLogId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Akcija { get; set; } = string.Empty; // kreiranje, izmena, brisanje, prijava, odjava
    public string Tabela { get; set; } = string.Empty;
    public string? EntitetId { get; set; }
    public string? StareVrednosti { get; set; }
    public string? NoveVrednosti { get; set; }
    public DateTime DatumVreme { get; set; } = DateTime.UtcNow;
    public string? IpAdresa { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
}
