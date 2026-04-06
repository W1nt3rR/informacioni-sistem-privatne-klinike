namespace PrivateClinic.API.Models;

public class Appointment
{
    public int AppointmentId { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int ServiceId { get; set; }
    public int? OfficeId { get; set; }
    public DateTime DatumVreme { get; set; }
    public int TrajanjeMinuta { get; set; }
    public string Status { get; set; } = "zakazan"; // zahtev, zakazan, realizovan, otkazao_pacijent, otkazala_klinika, nije_se_pojavio
    public string? RazlogPromene { get; set; }
    public string? RazlogOtkazivanja { get; set; }
    public string? CreatorId { get; set; }
    public DateTime DatumKreiranja { get; set; } = DateTime.UtcNow;

    // Navigation
    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public Office? Office { get; set; }
    public ApplicationUser? Creator { get; set; }
    public Examination? Examination { get; set; }
    public Invoice? Invoice { get; set; }
    public ICollection<Notification> Notifications { get; set; } = [];
}
