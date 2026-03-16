namespace PrivateClinic.API.Models;

public class Diagnosis
{
    public int DiagnosisId { get; set; }
    public string Sifra { get; set; } = string.Empty;
    public string Naziv { get; set; } = string.Empty;
    public string? Opis { get; set; }

    // Navigation
    public ICollection<Examination> Examinations { get; set; } = [];
}
