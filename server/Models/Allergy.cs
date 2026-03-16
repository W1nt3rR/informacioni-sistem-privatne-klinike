namespace PrivateClinic.API.Models;

public class Allergy
{
    public int AllergyId { get; set; }
    public int PatientId { get; set; }
    public string NazivAlergena { get; set; } = string.Empty;
    public string? Opis { get; set; }
    public string Ozbiljnost { get; set; } = "blaga"; // blaga, umerena, teska

    // Navigation
    public Patient Patient { get; set; } = null!;
}
