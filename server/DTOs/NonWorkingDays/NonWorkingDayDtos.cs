namespace PrivateClinic.API.DTOs.NonWorkingDays;

public record NonWorkingDayResponse(int NonWorkingDayId, DateOnly Datum, string Naziv, string? Opis);
public record CreateNonWorkingDayRequest(DateOnly Datum, string Naziv, string? Opis);
public record UpdateNonWorkingDayRequest(DateOnly Datum, string Naziv, string? Opis);
