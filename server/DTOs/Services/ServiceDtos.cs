namespace PrivateClinic.API.DTOs.Services;

public record ServiceResponse(
    int ServiceId,
    string Naziv,
    string? Opis,
    int TrajanjeMinuta,
    decimal Cena,
    int SpecializationId,
    string SpecijalizacijaNaziv,
    bool Aktivan);

public record CreateServiceRequest(
    string Naziv,
    string? Opis,
    int TrajanjeMinuta,
    decimal Cena,
    int SpecializationId);

public record UpdateServiceRequest(
    string Naziv,
    string? Opis,
    int TrajanjeMinuta,
    decimal Cena,
    int SpecializationId);
