namespace PrivateClinic.API.Models;

public class Invoice
{
    public int InvoiceId { get; set; }
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public string BrojRacuna { get; set; } = string.Empty;
    public DateTime DatumIzdavanja { get; set; } = DateTime.UtcNow;
    public decimal UkupanIznos { get; set; }
    public decimal PopustProcenat { get; set; }
    public decimal IznosZaNaplatu { get; set; }
    public string StatusNaplate { get; set; } = "neplaceno"; // placeno, neplaceno, delimicno
    public string? Napomena { get; set; }

    // Navigation
    public Patient Patient { get; set; } = null!;
    public Appointment? Appointment { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<InvoiceDiscount> InvoiceDiscounts { get; set; } = [];
}
