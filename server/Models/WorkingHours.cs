namespace PrivateClinic.API.Models;

public class WorkingHours
{
    public int WorkingHoursId { get; set; }
    public int? DoctorId { get; set; }
    public int DanUNedelji { get; set; } // 1=Monday ... 7=Sunday
    public TimeOnly VremeOd { get; set; }
    public TimeOnly VremeDo { get; set; }

    // Navigation
    public Doctor? Doctor { get; set; }
}
