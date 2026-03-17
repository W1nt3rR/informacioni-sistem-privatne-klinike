using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Invoices;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize(Roles = "admin,recepcija,menadzer")]
public class InvoicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<InvoiceListResponse>>> GetAll(
        [FromQuery] string? status,
        [FromQuery] int? patientId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var q = db.Invoices.Include(i => i.Patient).AsQueryable();

        if (!string.IsNullOrEmpty(status))
            q = q.Where(i => i.StatusNaplate == status);
        if (patientId.HasValue)
            q = q.Where(i => i.PatientId == patientId.Value);
        if (from.HasValue)
            q = q.Where(i => i.DatumIzdavanja >= from.Value);
        if (to.HasValue)
            q = q.Where(i => i.DatumIzdavanja <= to.Value);

        var list = await q.OrderByDescending(i => i.DatumIzdavanja)
            .Select(i => new InvoiceListResponse(
                i.InvoiceId, i.BrojRacuna, i.DatumIzdavanja,
                i.UkupanIznos, i.PopustProcenat, i.IznosZaNaplatu,
                i.StatusNaplate, i.Napomena,
                i.PatientId, i.Patient.Ime, i.Patient.Prezime))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InvoiceDetailResponse>> GetById(int id)
    {
        var inv = await db.Invoices
            .Include(i => i.Patient)
            .Include(i => i.Items).ThenInclude(it => it.Service)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == id);

        if (inv is null) return NotFound();

        return Ok(new InvoiceDetailResponse(
            inv.InvoiceId, inv.BrojRacuna, inv.DatumIzdavanja,
            inv.UkupanIznos, inv.PopustProcenat, inv.IznosZaNaplatu,
            inv.StatusNaplate, inv.Napomena,
            inv.PatientId, inv.Patient.Ime, inv.Patient.Prezime,
            inv.Items.Select(it => new InvoiceItemResponse(
                it.InvoiceItemId, it.ServiceId, it.Service.Naziv,
                it.ExaminationId, it.JedinicnaCena, it.Kolicina,
                it.PopustProcenat, it.Iznos)).ToList(),
            inv.Payments.OrderByDescending(p => p.DatumPlacanja)
                .Select(p => new PaymentResponse(
                    p.PaymentId, p.Iznos, p.NacinPlacanja,
                    p.DatumPlacanja, p.Napomena)).ToList()));
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDetailResponse>> Create(CreateInvoiceRequest req)
    {
        var patient = await db.Patients.FindAsync(req.PatientId);
        if (patient is null) return BadRequest("Patient not found");

        var serviceIds = req.Items.Select(i => i.ServiceId).Distinct().ToList();
        var services = await db.Services
            .Where(s => serviceIds.Contains(s.ServiceId))
            .ToDictionaryAsync(s => s.ServiceId);

        if (services.Count != serviceIds.Count)
            return BadRequest("One or more services not found");

        var brojRacuna = await GenerateBrojRacuna();

        var invoice = new Invoice
        {
            PatientId = req.PatientId,
            BrojRacuna = brojRacuna,
            PopustProcenat = req.PopustProcenat,
            Napomena = req.Napomena,
            DatumIzdavanja = DateTime.UtcNow
        };

        decimal total = 0;
        foreach (var item in req.Items)
        {
            var svc = services[item.ServiceId];
            var lineTotal = svc.Cena * item.Kolicina;
            var discountedTotal = lineTotal - (lineTotal * item.PopustProcenat / 100);
            var invoiceItem = new InvoiceItem
            {
                ServiceId = item.ServiceId,
                ExaminationId = item.ExaminationId,
                JedinicnaCena = svc.Cena,
                Kolicina = item.Kolicina,
                PopustProcenat = item.PopustProcenat,
                Iznos = discountedTotal
            };
            invoice.Items.Add(invoiceItem);
            total += discountedTotal;
        }

        invoice.UkupanIznos = total;
        invoice.IznosZaNaplatu = total - (total * req.PopustProcenat / 100);

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.InvoiceId },
            await GetById(invoice.InvoiceId));
    }

    [HttpGet("{id:int}/print")]
    public async Task<ActionResult<InvoiceDetailResponse>> GetPrintData(int id)
    {
        return await GetById(id);
    }

    [HttpGet("daily-report")]
    public async Task<ActionResult<DailyRevenueResponse>> DailyReport([FromQuery] DateTime? date)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var nextDay = targetDate.AddDays(1);

        var invoices = await db.Invoices
            .Include(i => i.Patient)
            .Where(i => i.DatumIzdavanja >= targetDate && i.DatumIzdavanja < nextDay)
            .OrderByDescending(i => i.DatumIzdavanja)
            .ToListAsync();

        var paymentCount = await db.Payments
            .Where(p => p.DatumPlacanja >= targetDate && p.DatumPlacanja < nextDay)
            .CountAsync();

        var totalRevenue = await db.Payments
            .Where(p => p.DatumPlacanja >= targetDate && p.DatumPlacanja < nextDay)
            .SumAsync(p => (decimal?)p.Iznos) ?? 0;

        return Ok(new DailyRevenueResponse(
            targetDate,
            totalRevenue,
            invoices.Count,
            paymentCount,
            invoices.Select(i => new InvoiceListResponse(
                i.InvoiceId, i.BrojRacuna, i.DatumIzdavanja,
                i.UkupanIznos, i.PopustProcenat, i.IznosZaNaplatu,
                i.StatusNaplate, i.Napomena,
                i.PatientId, i.Patient.Ime, i.Patient.Prezime)).ToList()));
    }

    private async Task<string> GenerateBrojRacuna()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"RN-{today}-";

        var lastNumber = await db.Invoices
            .Where(i => i.BrojRacuna.StartsWith(prefix))
            .OrderByDescending(i => i.BrojRacuna)
            .Select(i => i.BrojRacuna)
            .FirstOrDefaultAsync();

        int seq = 1;
        if (lastNumber is not null)
        {
            var numPart = lastNumber[prefix.Length..];
            if (int.TryParse(numPart, out int parsed))
                seq = parsed + 1;
        }

        return $"{prefix}{seq:D3}";
    }
}
