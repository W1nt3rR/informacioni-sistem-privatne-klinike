namespace PrivateClinic.API.DTOs.Discounts;

public record DiscountResponse(int DiscountId, string Naziv, string Tip, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan, bool JeSistemski, string? Kod);
public record CreateDiscountRequest(string Naziv, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan = true, string? Kod = null);
public record UpdateDiscountRequest(string Naziv, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan);
public record ValidateCodeRequest(string Kod);
public record ValidateCodeResponse(bool Valid, int? DiscountId, string? Naziv, decimal? Procenat);
