namespace PrivateClinic.API.DTOs.Examinations;

public record ExaminationListResponse(
    int ExaminationId,
    int AppointmentId,
    string PatientIme,
    string PatientPrezime,
    string DoctorIme,
    string DoctorPrezime,
    string? DijagnozaSifra,
    string? DijagnozaNaziv,
    DateTime DatumPregleda,
    string Status);

public record ExaminationDetailResponse(
    int ExaminationId,
    int AppointmentId,
    int PatientId,
    string PatientIme,
    string PatientPrezime,
    int DoctorId,
    string DoctorIme,
    string DoctorPrezime,
    string? Anamneza,
    string? Simptomi,
    int? DiagnosisId,
    string? DijagnozaSifra,
    string? DijagnozaTekst,
    string? Zakljucak,
    string? Preporuka,
    DateTime DatumPregleda,
    string Status,
    List<TherapyResponse> Therapies,
    List<ReferralResponse> Referrals,
    MedicalReportResponse? MedicalReport);

public record CreateExaminationRequest(int AppointmentId);

public record UpdateExaminationRequest(
    string? Anamneza,
    string? Simptomi,
    int? DiagnosisId,
    string? DijagnozaTekst,
    string? Zakljucak,
    string? Preporuka);

public record TherapyResponse(
    int TherapyId,
    int ExaminationId,
    string NazivLeka,
    string Doza,
    string Ucestalost,
    string Trajanje,
    string? Napomena);

public record CreateTherapyRequest(
    string NazivLeka,
    string Doza,
    string Ucestalost,
    string Trajanje,
    string? Napomena);

public record UpdateTherapyRequest(
    string NazivLeka,
    string Doza,
    string Ucestalost,
    string Trajanje,
    string? Napomena);

public record ReferralResponse(
    int ReferralId,
    int ExaminationId,
    string Tip,
    string Opis,
    string Status);

public record CreateReferralRequest(string Tip, string Opis);
public record UpdateReferralRequest(string Tip, string Opis, string Status);

public record MedicalReportResponse(
    int MedicalReportId,
    int ExaminationId,
    string Sadrzaj,
    DateTime DatumKreiranja,
    string Status);

public record CreateMedicalReportRequest(string Sadrzaj);
public record UpdateMedicalReportRequest(string Sadrzaj);
