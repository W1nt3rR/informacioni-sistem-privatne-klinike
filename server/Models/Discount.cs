namespace PrivateClinic.API.Models;

public class Discount
{
    public int DiscountId { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string Tip { get; set; } = "opsti"; // student, penzioner, paket2, paket3, opsti, kod
    public decimal Procenat { get; set; }
    public DateOnly? VaziOd { get; set; }
    public DateOnly? VaziDo { get; set; }
    public bool Aktivan { get; set; } = true;
    public bool JeSistemski { get; set; } // true = cannot be deleted (student, penzioner, paket2, paket3, opsti)
    public string? Kod { get; set; } // discount code for tip="kod"

    public ICollection<InvoiceDiscount> InvoiceDiscounts { get; set; } = [];
}
