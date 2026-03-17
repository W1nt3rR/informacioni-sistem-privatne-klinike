namespace PrivateClinic.API.DTOs.Portal;

public record PortalRegisterRequest(
    string UserName,
    string Password,
    string Ime,
    string Prezime,
    string JMBG,
    DateOnly DatumRodjenja,
    string Pol,
    string? Adresa,
    string? Telefon,
    string? Email);

public record PortalAppointmentResponse(
    int AppointmentId,
    string ServiceName,
    string DoctorName,
    DateTime DatumVreme,
    int TrajanjeMinuta,
    string Status);

public record PortalAppointmentRequest(
    int ServiceId,
    int DoctorId,
    DateTime DatumVreme,
    string? Napomena);

public record PortalMedicalReportResponse(
    int MedicalReportId,
    int ExaminationId,
    string DoctorName,
    string ServiceName,
    DateTime DatumPregleda,
    string? Dijagnoza,
    string? Preporuka,
    string Sadrzaj,
    bool Potpisan);

public record PortalMessageResponse(
    int MessageId,
    string PosiljalacTip,
    int PosiljalacId,
    string Sadrzaj,
    DateTime DatumSlanja,
    bool Procitana);

public record SendMessageRequest(
    string Sadrzaj);
