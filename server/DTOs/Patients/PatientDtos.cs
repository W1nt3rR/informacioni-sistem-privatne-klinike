namespace PrivateClinic.API.DTOs.Patients;

public record PatientListResponse(
    int PatientId,
    string Ime,
    string Prezime,
    string JMBG,
    string DatumRodjenja,
    string Pol,
    string Telefon,
    string? Email,
    bool Aktivan);

public record PatientDetailResponse(
    int PatientId,
    string Ime,
    string Prezime,
    string JMBG,
    string DatumRodjenja,
    string Pol,
    string? Adresa,
    string Telefon,
    string? Email,
    string? BrojOsiguranja,
    string? Napomene,
    DateTime DatumRegistracije,
    bool Aktivan,
    List<AllergyResponse> Allergies);

public record AllergyResponse(
    int AllergyId,
    string NazivAlergena,
    string? Opis,
    string Ozbiljnost);

public record CreatePatientRequest(
    string Ime,
    string Prezime,
    string JMBG,
    string DatumRodjenja,
    string Pol,
    string? Adresa,
    string Telefon,
    string? Email,
    string? BrojOsiguranja,
    string? Napomene,
    string? UserId = null);

public record UpdatePatientRequest(
    string Ime,
    string Prezime,
    string JMBG,
    string DatumRodjenja,
    string Pol,
    string? Adresa,
    string Telefon,
    string? Email,
    string? BrojOsiguranja,
    string? Napomene);

public record CreateAllergyRequest(
    string NazivAlergena,
    string? Opis,
    string Ozbiljnost);

public record UpdateAllergyRequest(
    string NazivAlergena,
    string? Opis,
    string Ozbiljnost);

public record PatientHistoryResponse(
    List<PatientAppointmentSummary> Appointments,
    List<PatientExaminationSummary> Examinations);

public record PatientAppointmentSummary(
    int AppointmentId,
    DateTime DatumVreme,
    string UslugaNaziv,
    string LekarIme,
    string Status);

public record PatientExaminationSummary(
    int ExaminationId,
    DateTime DatumPregleda,
    string? DijagnozaTekst,
    string LekarIme,
    string Status);
