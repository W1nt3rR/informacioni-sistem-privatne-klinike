namespace PrivateClinic.API.Models;

public class InvoiceItem
{
    public int InvoiceItemId { get; set; }
    public int InvoiceId { get; set; }
    public int ServiceId { get; set; }
    public int? ExaminationId { get; set; }
    public decimal JedinicnaCena { get; set; }
    public int Kolicina { get; set; } = 1;
    public decimal PopustProcenat { get; set; }
    public decimal Iznos { get; set; }

    // Navigation
    public Invoice Invoice { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public Examination? Examination { get; set; }
}
