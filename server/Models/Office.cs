namespace PrivateClinic.API.Models;

public class Office
{
    public int OfficeId { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string? Lokacija { get; set; }
    public string? Oprema { get; set; }
    public bool Dostupna { get; set; } = true;

    // Navigation
    public ICollection<Appointment> Appointments { get; set; } = [];
}
