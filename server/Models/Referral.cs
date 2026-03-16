namespace PrivateClinic.API.Models;

public class Referral
{
    public int ReferralId { get; set; }
    public int ExaminationId { get; set; }
    public string Tip { get; set; } = string.Empty; // laboratorija, specijalisticki, dijagnostika
    public string Opis { get; set; } = string.Empty;
    public string Status { get; set; } = "izdato"; // izdato, realizovano, otkazano

    // Navigation
    public Examination Examination { get; set; } = null!;
}
