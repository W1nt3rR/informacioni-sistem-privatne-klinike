namespace PrivateClinic.API.Models;

public class MedicalReport
{
    public int MedicalReportId { get; set; }
    public int ExaminationId { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public string Sadrzaj { get; set; } = string.Empty;
    public DateTime DatumKreiranja { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "kreiran"; // kreiran, potpisan, arhiviran

    // Navigation
    public Examination Examination { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public Doctor Doctor { get; set; } = null!;
}
