namespace PrivateClinic.API.DTOs.Diagnoses;

public record DiagnosisResponse(int DiagnosisId, string Sifra, string Naziv, string? Opis);
public record CreateDiagnosisRequest(string Sifra, string Naziv, string? Opis);
public record UpdateDiagnosisRequest(string Sifra, string Naziv, string? Opis);
