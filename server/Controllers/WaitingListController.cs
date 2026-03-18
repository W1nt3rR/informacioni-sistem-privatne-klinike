using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.WaitingList;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/waiting-list")]
[Authorize(Roles = "admin,recepcija")]
public class WaitingListController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WaitingListItemResponse>>> GetAll(
        [FromQuery] string? status)
    {
        var query = db.WaitingListItems
            .Include(w => w.Patient)
            .Include(w => w.Service)
            .Include(w => w.Doctor)!.ThenInclude(d => d!.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(w => w.Status == status);

        var items = await query
            .OrderBy(w => w.Prioritet)
            .ThenBy(w => w.DatumUpisa)
            .Select(w => new WaitingListItemResponse(
                w.WaitingListItemId,
                w.PatientId,
                $"{w.Patient.Ime} {w.Patient.Prezime}",
                w.ServiceId,
                w.Service.Naziv,
                w.DoctorId,
                w.Doctor != null ? $"{w.Doctor.User.Ime} {w.Doctor.User.Prezime}" : null,
                w.DatumUpisa,
                w.Prioritet,
                w.Status,
                w.Napomena))
            .ToListAsync();

        return items;
    }

    [HttpPost]
    public async Task<ActionResult<WaitingListItemResponse>> Create(
        [FromBody] CreateWaitingListItemRequest req)
    {
        // Duplicate check: same patient + service already active
        var duplicate = await db.WaitingListItems.AnyAsync(w =>
            w.PatientId == req.PatientId && w.ServiceId == req.ServiceId && w.Status == "aktivan");
        if (duplicate)
            return BadRequest(new { message = "Pacijent je već na listi čekanja za ovu uslugu." });

        var item = new WaitingListItem
        {
            PatientId = req.PatientId,
            ServiceId = req.ServiceId,
            DoctorId = req.DoctorId,
            Prioritet = req.Prioritet,
            Napomena = req.Napomena
        };

        db.WaitingListItems.Add(item);
        await db.SaveChangesAsync();

        // Reload with navigations
        var created = await db.WaitingListItems
            .Include(w => w.Patient)
            .Include(w => w.Service)
            .Include(w => w.Doctor)!.ThenInclude(d => d!.User)
            .Where(w => w.WaitingListItemId == item.WaitingListItemId)
            .Select(w => new WaitingListItemResponse(
                w.WaitingListItemId,
                w.PatientId,
                $"{w.Patient.Ime} {w.Patient.Prezime}",
                w.ServiceId,
                w.Service.Naziv,
                w.DoctorId,
                w.Doctor != null ? $"{w.Doctor.User.Ime} {w.Doctor.User.Prezime}" : null,
                w.DatumUpisa,
                w.Prioritet,
                w.Status,
                w.Napomena))
            .FirstAsync();

        return Created($"api/waiting-list/{item.WaitingListItemId}", created);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id,
        [FromBody] UpdateWaitingListStatusRequest req)
    {
        var item = await db.WaitingListItems.FindAsync(id);
        if (item is null) return NotFound();

        string[] validStatuses = ["aktivan", "zakazan", "istekao"];
        if (!validStatuses.Contains(req.Status))
            return BadRequest(new { message = $"Nepoznat status: {req.Status}" });

        item.Status = req.Status;
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.WaitingListItems.FindAsync(id);
        if (item is null) return NotFound();

        db.WaitingListItems.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id}/convert")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> Convert(int id, [FromBody] ConvertWaitingListRequest req)
    {
        var item = await db.WaitingListItems
            .Include(w => w.Patient)
            .Include(w => w.Service)
            .FirstOrDefaultAsync(w => w.WaitingListItemId == id);

        if (item is null) return NotFound();
        if (item.Status != "aktivan")
            return BadRequest(new { message = "Samo aktivne stavke mogu biti pretvorene u termin." });

        var doctorId = req.DoctorId ?? item.DoctorId;
        if (doctorId is null)
            return BadRequest(new { message = "Morate odabrati lekara." });

        var service = item.Service;
        var trajanje = service.TrajanjeMinuta;
        var kraj = req.DatumVreme.AddMinutes(trajanje);

        if (req.DatumVreme < DateTime.Now)
            return BadRequest(new { message = "Ne možete zakazati termin u prošlosti." });

        // Conflict: non-working day
        var dateOnly = DateOnly.FromDateTime(req.DatumVreme);
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return BadRequest(new { message = "Odabrani datum je neradni dan." });

        // Conflict: working hours
        var dayOfWeek = (int)req.DatumVreme.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == doctorId.Value && w.DanUNedelji == dayOfWeek);
        if (wh == null) return BadRequest(new { message = "Lekar ne radi tog dana." });

        var timeStart = TimeOnly.FromDateTime(req.DatumVreme);
        var timeEnd = TimeOnly.FromDateTime(kraj);
        if (timeStart < wh.VremeOd || timeEnd > wh.VremeDo)
            return BadRequest(new { message = "Termin je van radnog vremena lekara." });

        // Conflict: doctor busy
        var doctorBusy = await db.Appointments.AnyAsync(a =>
            a.DoctorId == doctorId.Value &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (doctorBusy) return BadRequest(new { message = "Lekar je zauzet u odabranom terminu." });

        // Conflict: office busy
        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == req.OfficeId &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (officeBusy) return BadRequest(new { message = "Ordinacija je zauzeta u odabranom terminu." });

        var appointment = new Appointment
        {
            PatientId = item.PatientId,
            DoctorId = doctorId.Value,
            ServiceId = item.ServiceId,
            OfficeId = req.OfficeId,
            DatumVreme = req.DatumVreme,
            TrajanjeMinuta = trajanje,
            CreatorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!,
        };

        db.Appointments.Add(appointment);
        item.Status = "zakazan";
        await db.SaveChangesAsync();

        // Auto-create invoice for converted appointment
        var patient = await db.Patients.FindAsync(item.PatientId);
        var discountPercent = await CalculateDiscountPercent(patient!);

        var brojRacuna = await GenerateBrojRacuna();
        var invoice = new Invoice
        {
            PatientId = item.PatientId,
            AppointmentId = appointment.AppointmentId,
            BrojRacuna = brojRacuna,
            PopustProcenat = discountPercent,
            DatumIzdavanja = DateTime.UtcNow,
        };
        var lineTotal = service.Cena;
        var discountedLine = lineTotal * (1 - discountPercent / 100m);
        invoice.Items.Add(new InvoiceItem
        {
            ServiceId = service.ServiceId,
            JedinicnaCena = service.Cena,
            Kolicina = 1,
            PopustProcenat = discountPercent,
            Iznos = Math.Round(discountedLine, 2),
        });
        invoice.UkupanIznos = lineTotal;
        invoice.IznosZaNaplatu = Math.Round(discountedLine, 2);
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        return Ok(new { message = "Termin uspešno zakazan sa liste čekanja.", appointmentId = appointment.AppointmentId });
    }

    private async Task<decimal> CalculateDiscountPercent(Patient patient)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var applicableTypes = new List<string> { "opsti" };
        if (patient.JeStudent) applicableTypes.Add("student");
        if (patient.JePenzioner) applicableTypes.Add("penzioner");

        var discounts = await db.Discounts
            .Where(d => d.Aktivan &&
                applicableTypes.Contains(d.Tip) &&
                (d.VaziOd == null || d.VaziOd <= today) &&
                (d.VaziDo == null || d.VaziDo >= today))
            .ToListAsync();

        var total = discounts.Sum(d => d.Procenat);
        return Math.Min(total, 100m);
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
