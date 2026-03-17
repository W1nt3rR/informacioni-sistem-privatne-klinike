namespace PrivateClinic.API.DTOs.Specializations;

public record SpecializationResponse(int SpecializationId, string Naziv, string? Opis);
public record CreateSpecializationRequest(string Naziv, string? Opis);
public record UpdateSpecializationRequest(string Naziv, string? Opis);
