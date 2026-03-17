namespace PrivateClinic.API.DTOs.Discounts;

public record DiscountResponse(int DiscountId, string Naziv, string Tip, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan);
public record CreateDiscountRequest(string Naziv, string Tip, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan = true);
public record UpdateDiscountRequest(string Naziv, string Tip, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan);
