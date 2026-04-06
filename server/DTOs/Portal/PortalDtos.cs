using System.ComponentModel.DataAnnotations;

namespace PrivateClinic.API.DTOs.Portal;

public record PortalRegisterRequest(
    [Required, StringLength(50)] string UserName,
    [Required, MinLength(6)] string Password,
    [Required, StringLength(50)] string Ime,
    [Required, StringLength(50)] string Prezime,
    [Required, StringLength(13, MinimumLength = 13), RegularExpression(@"^\d{13}$", ErrorMessage = "JMBG mora sadržati tačno 13 cifara.")] string JMBG,
    [Required] DateOnly DatumRodjenja,
    [Required, RegularExpression(@"^[MŽ]$", ErrorMessage = "Pol mora biti 'M' ili 'Ž'.")] string Pol,
    [StringLength(200)] string? Adresa,
    [StringLength(20)] string? Telefon,
    [EmailAddress, StringLength(100)] string? Email);

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
