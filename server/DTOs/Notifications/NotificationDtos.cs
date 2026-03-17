namespace PrivateClinic.API.DTOs.Notifications;

public record NotificationListResponse(
    int NotificationId,
    string Tip,
    string PrimalacTip,
    int PrimalacId,
    string PrimalacIme,
    string Sadrzaj,
    DateTime DatumSlanja,
    string Status,
    int? AppointmentId);

public record CreateNotificationRequest(
    string Tip,
    string PrimalacTip,
    int PrimalacId,
    string Sadrzaj,
    int? AppointmentId);
