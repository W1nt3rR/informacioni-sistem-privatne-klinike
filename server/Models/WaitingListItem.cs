namespace PrivateClinic.API.Models;

public class WaitingListItem
{
    public int WaitingListItemId { get; set; }
    public int PatientId { get; set; }
    public int ServiceId { get; set; }
    public int? DoctorId { get; set; }
    public DateTime DatumUpisa { get; set; } = DateTime.UtcNow;
    public int Prioritet { get; set; } = 2; // 1=visok, 2=srednji, 3=nizak
    public string Status { get; set; } = "aktivan"; // aktivan, zakazan, istekao
    public string? Napomena { get; set; }

    // Navigation
    public Patient Patient { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public Doctor? Doctor { get; set; }
}
