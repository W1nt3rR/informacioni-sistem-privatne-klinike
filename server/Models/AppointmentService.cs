namespace PrivateClinic.API.Models;

public class AppointmentService
{
    public int AppointmentId { get; set; }
    public int ServiceId { get; set; }

    // Navigation
    public Appointment Appointment { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
