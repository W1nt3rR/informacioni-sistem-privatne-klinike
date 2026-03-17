namespace PrivateClinic.API.DTOs.Offices;

public record OfficeResponse(int OfficeId, string Naziv, string? Lokacija, string? Oprema, bool Dostupna);
public record CreateOfficeRequest(string Naziv, string? Lokacija, string? Oprema, bool Dostupna = true);
public record UpdateOfficeRequest(string Naziv, string? Lokacija, string? Oprema, bool Dostupna);
