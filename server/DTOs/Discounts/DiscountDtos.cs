namespace PrivateClinic.API.DTOs.Discounts;

public record DiscountResponse(int DiscountId, string Naziv, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan);
public record CreateDiscountRequest(string Naziv, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan = true);
public record UpdateDiscountRequest(string Naziv, decimal Procenat, DateOnly? VaziOd, DateOnly? VaziDo, bool Aktivan);
