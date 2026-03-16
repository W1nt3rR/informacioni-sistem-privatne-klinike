namespace PrivateClinic.API.Models;

public class DoctorService
{
    public int DoctorId { get; set; }
    public int ServiceId { get; set; }

    // Navigation
    public Doctor Doctor { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
