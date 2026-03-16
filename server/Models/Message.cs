namespace PrivateClinic.API.Models;

public class Message
{
    public int MessageId { get; set; }
    public string PosiljalacTip { get; set; } = string.Empty; // pacijent, korisnik
    public int PosiljalacId { get; set; }
    public string PrimalacTip { get; set; } = string.Empty; // pacijent, korisnik
    public int PrimalacId { get; set; }
    public string Sadrzaj { get; set; } = string.Empty;
    public DateTime DatumSlanja { get; set; } = DateTime.UtcNow;
    public bool Procitana { get; set; }
}
