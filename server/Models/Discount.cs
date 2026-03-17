namespace PrivateClinic.API.Models;

public class Discount
{
    public int DiscountId { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string Tip { get; set; } = "opsti"; // opsti, student, penzioner
    public decimal Procenat { get; set; }
    public DateOnly? VaziOd { get; set; }
    public DateOnly? VaziDo { get; set; }
    public bool Aktivan { get; set; } = true;
}
