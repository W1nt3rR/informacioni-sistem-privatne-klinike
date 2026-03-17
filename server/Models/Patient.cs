namespace PrivateClinic.API.Models;

public class Patient
{
    public int PatientId { get; set; }
    public string Ime { get; set; } = string.Empty;
    public string Prezime { get; set; } = string.Empty;
    public string JMBG { get; set; } = string.Empty;
    public DateOnly DatumRodjenja { get; set; }
    public string Pol { get; set; } = string.Empty;
    public string? Adresa { get; set; }
    public string Telefon { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? BrojOsiguranja { get; set; }
    public string? Napomene { get; set; }
    public bool JeStudent { get; set; }
    public bool JePenzioner { get; set; }
    public DateTime DatumRegistracije { get; set; } = DateTime.UtcNow;
    public bool Aktivan { get; set; } = true;

    // Optional link to user account (for patient portal)
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    // Navigation
    public ICollection<Allergy> Allergies { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<Examination> Examinations { get; set; } = [];
    public ICollection<MedicalReport> MedicalReports { get; set; } = [];
    public ICollection<Invoice> Invoices { get; set; } = [];
    public ICollection<WaitingListItem> WaitingListItems { get; set; } = [];
}
