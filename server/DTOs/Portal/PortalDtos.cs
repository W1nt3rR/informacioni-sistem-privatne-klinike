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

public record PortalInvoiceListResponse(
    int InvoiceId,
    string BrojRacuna,
    DateTime DatumIzdavanja,
    decimal UkupanIznos,
    decimal PopustProcenat,
    decimal IznosZaNaplatu,
    string StatusNaplate,
    decimal Placeno);

public record PortalInvoiceDetailResponse(
    int InvoiceId,
    string BrojRacuna,
    DateTime DatumIzdavanja,
    decimal UkupanIznos,
    decimal PopustProcenat,
    decimal IznosZaNaplatu,
    string StatusNaplate,
    string? Napomena,
    decimal Placeno,
    List<PortalInvoiceItemResponse> Items,
    List<PortalPaymentResponse> Payments);

public record PortalInvoiceItemResponse(
    string ServiceNaziv,
    int Kolicina,
    decimal JedinicnaCena,
    decimal Iznos);

public record PortalPaymentResponse(
    decimal Iznos,
    string NacinPlacanja,
    DateTime DatumPlacanja);

public record PortalPayInvoiceRequest(
    [Required, Range(0.01, double.MaxValue, ErrorMessage = "Iznos mora biti veći od 0.")]
    decimal Iznos,
    [Required, RegularExpression(@"^(kartica|virman)$", ErrorMessage = "Način plaćanja mora biti 'kartica' ili 'virman'.")]
    string NacinPlacanja);
