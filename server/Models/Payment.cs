namespace PrivateClinic.API.Models;

public class Payment
{
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public decimal Iznos { get; set; }
    public string NacinPlacanja { get; set; } = string.Empty; // gotovina, kartica, virman
    public DateTime DatumPlacanja { get; set; } = DateTime.UtcNow;
    public string? Napomena { get; set; }

    // Navigation
    public Invoice Invoice { get; set; } = null!;
}
