namespace PrivateClinic.API.DTOs.Appointments;

public record AppointmentListResponse(
    int AppointmentId,
    int PatientId,
    string PacijentIme,
    int DoctorId,
    string LekarIme,
    int ServiceId,
    string UslugaNaziv,
    int? OfficeId,
    string OrdinacijaNaziv,
    DateTime DatumVreme,
    int TrajanjeMinuta,
    string Status,
    int? ExaminationId,
    List<int> ServiceIds);

public record AppointmentDetailResponse(
    int AppointmentId,
    int PatientId,
    string PacijentIme,
    int DoctorId,
    string LekarIme,
    int ServiceId,
    string UslugaNaziv,
    int? OfficeId,
    string OrdinacijaNaziv,
    DateTime DatumVreme,
    int TrajanjeMinuta,
    string Status,
    string? RazlogPromene,
    string? RazlogOtkazivanja,
    string KreatorIme,
    DateTime DatumKreiranja,
    List<int> ServiceIds);

public record CreateAppointmentRequest(
    int PatientId,
    int DoctorId,
    List<int> ServiceIds,
    int OfficeId,
    DateTime DatumVreme);

public record RescheduleAppointmentRequest(
    DateTime DatumVreme,
    int? OfficeId,
    string? RazlogPromene);

public record ApproveAppointmentRequest(
    int OfficeId);

public record RejectAppointmentRequest(
    string? RazlogOtkazivanja);

public record CancelAppointmentRequest(
    string Status,
    string? RazlogOtkazivanja);

public record CalendarAppointmentResponse(
    int AppointmentId,
    string PacijentIme,
    string LekarIme,
    string UslugaNaziv,
    string OrdinacijaNaziv,
    DateTime DatumVreme,
    int TrajanjeMinuta,
    string Status);

public record AvailableSlotResponse(
    string VremeOd,
    string VremeDo);
