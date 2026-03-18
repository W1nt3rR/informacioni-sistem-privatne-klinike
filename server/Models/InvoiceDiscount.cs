namespace PrivateClinic.API.Models;

public class InvoiceDiscount
{
    public int InvoiceDiscountId { get; set; }
    public int InvoiceId { get; set; }
    public int DiscountId { get; set; }
    public decimal Procenat { get; set; } // snapshot of discount % at time of invoice

    public Invoice Invoice { get; set; } = null!;
    public Discount Discount { get; set; } = null!;
}
