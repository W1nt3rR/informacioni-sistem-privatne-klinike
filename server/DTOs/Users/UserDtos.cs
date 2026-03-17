namespace PrivateClinic.API.DTOs.Users;

public record UserListResponse(
    string Id,
    string UserName,
    string Ime,
    string Prezime,
    string? Email,
    string? PhoneNumber,
    bool Aktivan,
    DateTime DatumKreiranja,
    IEnumerable<string> Roles);

public record UserDetailResponse(
    string Id,
    string UserName,
    string Ime,
    string Prezime,
    string? Email,
    string? PhoneNumber,
    bool Aktivan,
    DateTime DatumKreiranja,
    IEnumerable<string> Roles,
    int? DoctorId);

public record CreateUserRequest(
    string UserName,
    string Password,
    string Ime,
    string Prezime,
    string? Email,
    string? PhoneNumber,
    string Role);

public record UpdateUserRequest(
    string Ime,
    string Prezime,
    string? Email,
    string? PhoneNumber,
    string Role);

public record ActivityLogResponse(
    int ActivityLogId,
    string UserId,
    string UserName,
    string Akcija,
    string Tabela,
    string? EntitetId,
    string? StareVrednosti,
    string? NoveVrednosti,
    DateTime DatumVreme,
    string? IpAdresa);
