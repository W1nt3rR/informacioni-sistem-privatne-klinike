namespace PrivateClinic.API.Models;

public class Doctor
{
    public int DoctorId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int SpecializationId { get; set; }
    public string? Titula { get; set; }
    public string LicencaBroj { get; set; } = string.Empty;
    public bool Aktivan { get; set; } = true;

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public Specialization Specialization { get; set; } = null!;
    public ICollection<DoctorService> DoctorServices { get; set; } = [];
    public ICollection<WorkingHours> WorkingHours { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<Examination> Examinations { get; set; } = [];
    public ICollection<MedicalReport> MedicalReports { get; set; } = [];
}
