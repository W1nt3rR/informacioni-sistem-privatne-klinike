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
            .Include(i => i.InvoiceDiscounts).ThenInclude(id => id.Discount)
            .FirstOrDefaultAsync(i => i.InvoiceId == id);

        if (inv is null) return NotFound();

        return Ok(MapToDetailResponse(inv));
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

        // Calculate subtotal
        decimal total = 0;
        var invoiceItems = new List<InvoiceItem>();
        foreach (var item in req.Items)
        {
            var svc = services[item.ServiceId];
            var lineTotal = svc.Cena * item.Kolicina;
            invoiceItems.Add(new InvoiceItem
            {
                ServiceId = item.ServiceId,
                ExaminationId = item.ExaminationId,
                JedinicnaCena = svc.Cena,
                Kolicina = item.Kolicina,
                PopustProcenat = 0,
                Iznos = lineTotal
            });
            total += lineTotal;
        }

        // Gather applicable discounts
        var appliedDiscounts = await GatherDiscounts(patient, req.Items.Count, req.KodPopusta);

        // Sum discounts, cap at 100%
        var cumulativePercent = Math.Min(appliedDiscounts.Sum(d => d.Procenat), 100m);

        var brojRacuna = await GenerateBrojRacuna();
        var discountAmount = total * cumulativePercent / 100;

        var invoice = new Invoice
        {
            PatientId = req.PatientId,
            BrojRacuna = brojRacuna,
            PopustProcenat = cumulativePercent,
            Napomena = req.Napomena,
            DatumIzdavanja = DateTime.UtcNow,
            UkupanIznos = total,
            IznosZaNaplatu = total - discountAmount
        };

        foreach (var item in invoiceItems)
            invoice.Items.Add(item);

        foreach (var ad in appliedDiscounts)
        {
            invoice.InvoiceDiscounts.Add(new InvoiceDiscount
            {
                DiscountId = ad.DiscountId,
                Procenat = ad.Procenat
            });
        }

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.InvoiceId },
            await GetById(invoice.InvoiceId));
    }

    /// <summary>Preview discounts and totals before creating an invoice.</summary>
    [HttpPost("preview")]
    public async Task<ActionResult<InvoicePreviewResponse>> Preview(InvoicePreviewRequest req)
    {
        var patient = await db.Patients.FindAsync(req.PatientId);
        if (patient is null) return BadRequest("Patient not found");

        var serviceIds = req.Items.Select(i => i.ServiceId).Distinct().ToList();
        var services = await db.Services
            .Where(s => serviceIds.Contains(s.ServiceId))
            .ToDictionaryAsync(s => s.ServiceId);

        decimal total = 0;
        foreach (var item in req.Items)
        {
            if (services.TryGetValue(item.ServiceId, out var svc))
                total += svc.Cena * item.Kolicina;
        }

        var appliedDiscounts = await GatherDiscounts(patient, req.Items.Count, req.KodPopusta);
        var cumulativePercent = Math.Min(appliedDiscounts.Sum(d => d.Procenat), 100m);
        var discountAmount = total * cumulativePercent / 100;

        return Ok(new InvoicePreviewResponse(
            total,
            cumulativePercent,
            total - discountAmount,
            appliedDiscounts.Select(d => new InvoiceDiscountResponse(d.Naziv, d.Tip, d.Procenat)).ToList()));
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

    // ---- Private helpers ----

    private async Task<List<Discount>> GatherDiscounts(Patient patient, int itemCount, string? kodPopusta)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var activeDiscounts = await db.Discounts
            .Where(d => d.Aktivan &&
                (d.VaziOd == null || d.VaziOd <= today) &&
                (d.VaziDo == null || d.VaziDo >= today))
            .ToListAsync();

        var applied = new List<Discount>();

        // 1. Student discount
        if (patient.JeStudent)
        {
            var studentDiscount = activeDiscounts.FirstOrDefault(d => d.Tip == "student");
            if (studentDiscount != null) applied.Add(studentDiscount);
        }

        // 2. Pensioner discount
        if (patient.JePenzioner)
        {
            var pensionerDiscount = activeDiscounts.FirstOrDefault(d => d.Tip == "penzioner");
            if (pensionerDiscount != null) applied.Add(pensionerDiscount);
        }

        // 3. Packet discounts (pick the best matching: 3+ overrides 2+)
        if (itemCount >= 3)
        {
            var paket3 = activeDiscounts.FirstOrDefault(d => d.Tip == "paket3");
            if (paket3 != null) applied.Add(paket3);
        }
        else if (itemCount >= 2)
        {
            var paket2 = activeDiscounts.FirstOrDefault(d => d.Tip == "paket2");
            if (paket2 != null) applied.Add(paket2);
        }

        // 4. General discount (opsti) - applies to everyone if > 0%
        var generalDiscount = activeDiscounts.FirstOrDefault(d => d.Tip == "opsti");
        if (generalDiscount != null && generalDiscount.Procenat > 0)
            applied.Add(generalDiscount);

        // 5. Discount code
        if (!string.IsNullOrWhiteSpace(kodPopusta))
        {
            var codeUpper = kodPopusta.Trim().ToUpperInvariant();
            var codeDiscount = activeDiscounts.FirstOrDefault(d => d.Tip == "kod" && d.Kod == codeUpper);
            if (codeDiscount != null) applied.Add(codeDiscount);
        }

        return applied;
    }

    private static InvoiceDetailResponse MapToDetailResponse(Invoice inv)
    {
        return new InvoiceDetailResponse(
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
                    p.DatumPlacanja, p.Napomena)).ToList(),
            inv.InvoiceDiscounts.Select(id => new InvoiceDiscountResponse(
                id.Discount.Naziv, id.Discount.Tip, id.Procenat)).ToList());
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
