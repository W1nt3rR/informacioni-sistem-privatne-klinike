namespace PrivateClinic.API.Models;

public class NonWorkingDay
{
    public int NonWorkingDayId { get; set; }
    public DateOnly Datum { get; set; }
    public string Naziv { get; set; } = string.Empty;
    public string? Opis { get; set; }
}
