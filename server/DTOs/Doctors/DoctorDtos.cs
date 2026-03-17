namespace PrivateClinic.API.DTOs.Doctors;

public record DoctorListResponse(
    int DoctorId,
    string UserId,
    string Ime,
    string Prezime,
    string Email,
    string? Telefon,
    string? Titula,
    string LicencaBroj,
    bool Aktivan,
    int SpecializationId,
    string SpecijalizacijaNaziv);

public record DoctorDetailResponse(
    int DoctorId,
    string UserId,
    string Ime,
    string Prezime,
    string Email,
    string? Telefon,
    string? Titula,
    string LicencaBroj,
    bool Aktivan,
    int SpecializationId,
    string SpecijalizacijaNaziv,
    List<DoctorServiceResponse> Services,
    List<WorkingHoursResponse> WorkingHours);

public record DoctorServiceResponse(
    int ServiceId,
    string Naziv,
    int TrajanjeMinuta,
    decimal Cena);

public record WorkingHoursResponse(
    int WorkingHoursId,
    int DanUNedelji,
    string VremeOd,
    string VremeDo);

public record CreateDoctorRequest(
    string Ime,
    string Prezime,
    string Email,
    string? Telefon,
    string UserName,
    string Password,
    int SpecializationId,
    string? Titula,
    string LicencaBroj);

public record UpdateDoctorRequest(
    string Ime,
    string Prezime,
    string Email,
    string? Telefon,
    int SpecializationId,
    string? Titula,
    string LicencaBroj);
