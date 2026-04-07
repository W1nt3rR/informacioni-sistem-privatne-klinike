namespace PrivateClinic.API.Models;

public class Service
{
    public int ServiceId { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string? Opis { get; set; }
    public int TrajanjeMinuta { get; set; }
    public decimal Cena { get; set; }
    public int SpecializationId { get; set; }
    public bool Aktivan { get; set; } = true;

    // Navigation
    public Specialization Specialization { get; set; } = null!;
    public ICollection<DoctorService> DoctorServices { get; set; } = [];
    public ICollection<Appointment> Appointments { get; set; } = [];
    public ICollection<AppointmentService> AppointmentServices { get; set; } = [];
    public ICollection<InvoiceItem> InvoiceItems { get; set; } = [];
    public ICollection<WaitingListItem> WaitingListItems { get; set; } = [];
}
