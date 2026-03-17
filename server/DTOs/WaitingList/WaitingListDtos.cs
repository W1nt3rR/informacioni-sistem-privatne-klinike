namespace PrivateClinic.API.DTOs.WaitingList;

public record WaitingListItemResponse(
    int WaitingListItemId,
    int PatientId,
    string PatientName,
    int ServiceId,
    string ServiceName,
    int? DoctorId,
    string? DoctorName,
    DateTime DatumUpisa,
    int Prioritet,
    string Status,
    string? Napomena);

public record CreateWaitingListItemRequest(
    int PatientId,
    int ServiceId,
    int? DoctorId,
    int Prioritet,
    string? Napomena);

public record UpdateWaitingListStatusRequest(
    string Status);
