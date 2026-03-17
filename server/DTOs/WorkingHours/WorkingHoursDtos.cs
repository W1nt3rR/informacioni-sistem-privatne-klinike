namespace PrivateClinic.API.DTOs.WorkingHours;

public record WorkingHoursResponse(
    int WorkingHoursId,
    int DanUNedelji,
    string VremeOd,
    string VremeDo);

public record SetWorkingHoursRequest(
    int DanUNedelji,
    string VremeOd,
    string VremeDo);
