namespace PrivateClinic.API.DTOs.Invoices;

public record InvoiceListResponse(
    int InvoiceId,
    string BrojRacuna,
    DateTime DatumIzdavanja,
    decimal UkupanIznos,
    decimal PopustProcenat,
    decimal IznosZaNaplatu,
    string StatusNaplate,
    string? Napomena,
    int PatientId,
    string PatientIme,
    string PatientPrezime);

public record InvoiceDetailResponse(
    int InvoiceId,
    string BrojRacuna,
    DateTime DatumIzdavanja,
    decimal UkupanIznos,
    decimal PopustProcenat,
    decimal IznosZaNaplatu,
    string StatusNaplate,
    string? Napomena,
    int PatientId,
    string PatientIme,
    string PatientPrezime,
    List<InvoiceItemResponse> Items,
    List<PaymentResponse> Payments);

public record InvoiceItemResponse(
    int InvoiceItemId,
    int ServiceId,
    string ServiceNaziv,
    int? ExaminationId,
    decimal JedinicnaCena,
    int Kolicina,
    decimal PopustProcenat,
    decimal Iznos);

public record PaymentResponse(
    int PaymentId,
    decimal Iznos,
    string NacinPlacanja,
    DateTime DatumPlacanja,
    string? Napomena);

public record CreateInvoiceRequest(
    int PatientId,
    decimal PopustProcenat,
    string? Napomena,
    List<CreateInvoiceItemRequest> Items);

public record CreateInvoiceItemRequest(
    int ServiceId,
    int? ExaminationId,
    int Kolicina,
    decimal PopustProcenat = 0);

public record CreatePaymentRequest(
    decimal Iznos,
    string NacinPlacanja,
    string? Napomena);

public record DailyRevenueResponse(
    DateTime Date,
    decimal TotalRevenue,
    int InvoiceCount,
    int PaymentCount,
    List<InvoiceListResponse> Invoices);
