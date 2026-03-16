namespace PrivateClinic.API.Models;

public class Examination
{
    public int ExaminationId { get; set; }
    public int AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public int PatientId { get; set; }
    public string? Anamneza { get; set; }
    public string? Simptomi { get; set; }
    public int? DiagnosisId { get; set; }
    public string? DijagnozaTekst { get; set; }
    public string? Zakljucak { get; set; }
    public string? Preporuka { get; set; }
    public DateTime DatumPregleda { get; set; }
    public string Status { get; set; } = "u_toku"; // u_toku, zavrsen, otkazan

    // Navigation
    public Appointment Appointment { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public Diagnosis? Diagnosis { get; set; }
    public ICollection<Therapy> Therapies { get; set; } = [];
    public ICollection<Referral> Referrals { get; set; } = [];
    public MedicalReport? MedicalReport { get; set; }
    public ICollection<InvoiceItem> InvoiceItems { get; set; } = [];
}
