namespace PrivateClinic.API.Models;

public class Notification
{
    public int NotificationId { get; set; }
    public string Tip { get; set; } = string.Empty; // podsetnik, raspored, kontrola, poruka
    public string PrimalacTip { get; set; } = string.Empty; // pacijent, lekar
    public int PrimalacId { get; set; }
    public string Sadrzaj { get; set; } = string.Empty;
    public DateTime DatumSlanja { get; set; }
    public string Status { get; set; } = "ceka"; // ceka, poslato, isporuceno, greska
    public int? AppointmentId { get; set; }

    // Navigation
    public Appointment? Appointment { get; set; }
}
