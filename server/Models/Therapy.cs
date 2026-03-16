namespace PrivateClinic.API.Models;

public class Therapy
{
    public int TherapyId { get; set; }
    public int ExaminationId { get; set; }
    public string NazivLeka { get; set; } = string.Empty;
    public string Doza { get; set; } = string.Empty;
    public string Ucestalost { get; set; } = string.Empty;
    public string Trajanje { get; set; } = string.Empty;
    public string? Napomena { get; set; }

    // Navigation
    public Examination Examination { get; set; } = null!;
}
