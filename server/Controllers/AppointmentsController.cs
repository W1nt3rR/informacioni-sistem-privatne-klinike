using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Appointments;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AppointmentListResponse>>> GetAll(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int? doctorId, [FromQuery] int? officeId, [FromQuery] string? status)
    {
        var query = db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .Include(a => a.Office)
            .AsQueryable();

        if (from.HasValue) query = query.Where(a => a.DatumVreme >= from.Value);
        if (to.HasValue) query = query.Where(a => a.DatumVreme <= to.Value);
        if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId.Value);
        if (officeId.HasValue) query = query.Where(a => a.OfficeId == officeId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(a => a.Status == status);

        var list = await query.OrderBy(a => a.DatumVreme).Select(a => new AppointmentListResponse(
            a.AppointmentId, a.PatientId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.DoctorId,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.ServiceId, a.Service.Naziv,
            a.OfficeId, a.Office.Naziv,
            a.DatumVreme, a.TrajanjeMinuta, a.Status
        )).ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AppointmentDetailResponse>> GetById(int id)
    {
        var a = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .Include(a => a.Office)
            .Include(a => a.Creator)
            .FirstOrDefaultAsync(a => a.AppointmentId == id);

        if (a == null) return NotFound();

        return Ok(new AppointmentDetailResponse(
            a.AppointmentId, a.PatientId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.DoctorId,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.ServiceId, a.Service.Naziv,
            a.OfficeId, a.Office.Naziv,
            a.DatumVreme, a.TrajanjeMinuta, a.Status,
            a.RazlogPromene, a.RazlogOtkazivanja,
            a.Creator.Ime + " " + a.Creator.Prezime,
            a.DatumKreiranja
        ));
    }

    [HttpPost]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<ActionResult<AppointmentDetailResponse>> Create(CreateAppointmentRequest req)
    {
        var service = await db.Services.FindAsync(req.ServiceId);
        if (service == null) return BadRequest("Usluga ne postoji.");

        if (req.DatumVreme < DateTime.Now)
            return BadRequest("Ne možete zakazati termin u prošlosti.");

        var trajanje = service.TrajanjeMinuta;
        var kraj = req.DatumVreme.AddMinutes(trajanje);

        // Conflict: non-working day
        var dateOnly = DateOnly.FromDateTime(req.DatumVreme);
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return BadRequest("Odabrani datum je neradni dan.");

        // Conflict: working hours
        var dayOfWeek = (int)req.DatumVreme.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7; // Sunday = 7
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == req.DoctorId && w.DanUNedelji == dayOfWeek);
        if (wh == null) return BadRequest("Lekar ne radi tog dana.");

        var timeStart = TimeOnly.FromDateTime(req.DatumVreme);
        var timeEnd = TimeOnly.FromDateTime(kraj);
        if (timeStart < wh.VremeOd || timeEnd > wh.VremeDo)
            return BadRequest("Termin je van radnog vremena lekara.");

        // Conflict: doctor busy
        var doctorBusy = await db.Appointments.AnyAsync(a =>
            a.DoctorId == req.DoctorId &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (doctorBusy) return BadRequest("Lekar je zauzet u odabranom terminu.");

        // Conflict: office busy
        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == req.OfficeId &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (officeBusy) return BadRequest("Ordinacija je zauzeta u odabranom terminu.");

        // Self-appointment guard
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.DoctorId == req.DoctorId);
        var patient = await db.Patients.FirstOrDefaultAsync(p => p.PatientId == req.PatientId);
        if (doctor != null && patient != null
            && !string.IsNullOrEmpty(doctor.UserId) && doctor.UserId == patient.UserId)
            return BadRequest("Lekar ne može zakazati termin sam sebi.");

        var appointment = new Appointment
        {
            PatientId = req.PatientId,
            DoctorId = req.DoctorId,
            ServiceId = req.ServiceId,
            OfficeId = req.OfficeId,
            DatumVreme = req.DatumVreme,
            TrajanjeMinuta = trajanje,
            CreatorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!,
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        // Auto-create invoice for this appointment
        await CreateInvoiceForAppointment(appointment, service);

        return await GetById(appointment.AppointmentId);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<ActionResult<AppointmentDetailResponse>> Reschedule(int id, RescheduleAppointmentRequest req)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment == null) return NotFound();

        if (appointment.Status != "zakazan")
            return BadRequest("Samo zakazani termini mogu biti pomereni.");

        var service = await db.Services.FindAsync(appointment.ServiceId);
        var trajanje = service!.TrajanjeMinuta;
        var kraj = req.DatumVreme.AddMinutes(trajanje);
        var officeId = req.OfficeId ?? appointment.OfficeId;

        // Conflict: non-working day
        var dateOnly = DateOnly.FromDateTime(req.DatumVreme);
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return BadRequest("Odabrani datum je neradni dan.");

        // Conflict: working hours
        var dayOfWeek = (int)req.DatumVreme.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == appointment.DoctorId && w.DanUNedelji == dayOfWeek);
        if (wh == null) return BadRequest("Lekar ne radi tog dana.");

        var timeStart = TimeOnly.FromDateTime(req.DatumVreme);
        var timeEnd = TimeOnly.FromDateTime(kraj);
        if (timeStart < wh.VremeOd || timeEnd > wh.VremeDo)
            return BadRequest("Termin je van radnog vremena lekara.");

        // Conflict: doctor busy (exclude this appointment)
        var doctorBusy = await db.Appointments.AnyAsync(a =>
            a.DoctorId == appointment.DoctorId && a.AppointmentId != id &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (doctorBusy) return BadRequest("Lekar je zauzet u odabranom terminu.");

        // Conflict: office busy (exclude this appointment)
        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == officeId && a.AppointmentId != id &&
            a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (officeBusy) return BadRequest("Ordinacija je zauzeta u odabranom terminu.");

        appointment.DatumVreme = req.DatumVreme;
        appointment.OfficeId = officeId;
        appointment.RazlogPromene = req.RazlogPromene;
        await db.SaveChangesAsync();

        return await GetById(id);
    }

    [HttpPatch("{id}/cancel")]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<IActionResult> Cancel(int id, CancelAppointmentRequest req)
    {
        var appointment = await db.Appointments.Include(a => a.Service).FirstOrDefaultAsync(a => a.AppointmentId == id);
        if (appointment == null) return NotFound();

        if (appointment.Status != "zakazan")
            return BadRequest("Samo zakazani termini mogu biti otkazani.");

        var validStatuses = new[] { "otkazao_pacijent", "otkazala_klinika", "nije_se_pojavio" };
        if (!validStatuses.Contains(req.Status))
            return BadRequest("Nevažeći status.");

        appointment.Status = req.Status;
        appointment.RazlogOtkazivanja = req.RazlogOtkazivanja;

        // Remove unpaid invoice linked to this appointment
        var invoice = await db.Invoices
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.AppointmentId == id);
        if (invoice != null && !invoice.Payments.Any())
        {
            db.InvoiceItems.RemoveRange(invoice.Items);
            db.Invoices.Remove(invoice);
        }

        await db.SaveChangesAsync();

        // Check waiting list for this service/doctor and create notification
        var waitingItems = await db.WaitingListItems
            .Include(w => w.Patient)
            .Where(w => w.ServiceId == appointment.ServiceId &&
                        (w.DoctorId == null || w.DoctorId == appointment.DoctorId) &&
                        w.Status == "aktivan")
            .OrderBy(w => w.Prioritet).ThenBy(w => w.DatumUpisa)
            .Take(3)
            .ToListAsync();

        foreach (var item in waitingItems)
        {
            db.Notifications.Add(new Notification
            {
                Tip = "raspored",
                PrimalacTip = "pacijent",
                PrimalacId = item.PatientId,
                Sadrzaj = $"Oslobodio se termin za {appointment.Service?.Naziv ?? "uslugu"} dana {appointment.DatumVreme:dd.MM.yyyy} u {appointment.DatumVreme:HH:mm}. Kontaktirajte kliniku za zakazivanje.",
                DatumSlanja = DateTime.UtcNow,
                AppointmentId = appointment.AppointmentId,
            });
        }
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment == null) return NotFound();

        string[] validStatuses = ["zakazan", "realizovan", "otkazao_pacijent", "otkazala_klinika", "nije_se_pojavio", "zahtev"];
        if (!validStatuses.Contains(status))
            return BadRequest($"Nevažeći status: {status}");

        appointment.Status = status;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("calendar")]
    public async Task<ActionResult<List<CalendarAppointmentResponse>>> Calendar(
        [FromQuery] int? doctorId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var query = db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .Include(a => a.Office)
            .Where(a => a.DatumVreme >= from && a.DatumVreme <= to)
            .Where(a => a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika");

        if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId.Value);

        var list = await query.OrderBy(a => a.DatumVreme).Select(a => new CalendarAppointmentResponse(
            a.AppointmentId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.Service.Naziv,
            a.Office.Naziv,
            a.DatumVreme, a.TrajanjeMinuta, a.Status
        )).ToListAsync();

        return Ok(list);
    }

    [HttpGet("available-slots")]
    public async Task<ActionResult<List<AvailableSlotResponse>>> AvailableSlots(
        [FromQuery] int doctorId, [FromQuery] int serviceId, [FromQuery] string date, [FromQuery] int? officeId)
    {
        if (!DateOnly.TryParse(date, out var dateOnly))
            return BadRequest("Nevažeći format datuma.");

        // Check non-working day
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return Ok(new List<AvailableSlotResponse>());

        // Get working hours for that day
        var dayOfWeek = (int)dateOnly.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == doctorId && w.DanUNedelji == dayOfWeek);
        if (wh == null) return Ok(new List<AvailableSlotResponse>());

        // Get service duration
        var service = await db.Services.FindAsync(serviceId);
        if (service == null) return BadRequest("Usluga ne postoji.");
        var duration = service.TrajanjeMinuta;

        // Get existing appointments for that doctor on that date
        var dateStart = dateOnly.ToDateTime(TimeOnly.MinValue);
        var dateEnd = dateOnly.ToDateTime(TimeOnly.MaxValue);
        var existing = await db.Appointments
            .Where(a => a.DoctorId == doctorId &&
                        a.DatumVreme >= dateStart && a.DatumVreme <= dateEnd &&
                        a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio")
            .OrderBy(a => a.DatumVreme)
            .Select(a => new { a.DatumVreme, a.TrajanjeMinuta, a.OfficeId })
            .ToListAsync();

        // Generate slots
        var slots = new List<AvailableSlotResponse>();
        var now = DateTime.Now;
        var current = wh.VremeOd;
        while (current.AddMinutes(duration) <= wh.VremeDo)
        {
            var slotStart = dateOnly.ToDateTime(current);
            var slotEnd = slotStart.AddMinutes(duration);

            // Skip slots that have already passed
            if (slotStart < now)
            {
                current = current.AddMinutes(15);
                continue;
            }

            var doctorConflict = existing.Any(e =>
                e.DatumVreme < slotEnd &&
                e.DatumVreme.AddMinutes(e.TrajanjeMinuta) > slotStart);

            var officeConflict = officeId.HasValue && existing.Any(e =>
                e.OfficeId == officeId.Value &&
                e.DatumVreme < slotEnd &&
                e.DatumVreme.AddMinutes(e.TrajanjeMinuta) > slotStart);

            var conflict = doctorConflict || officeConflict;

            if (!conflict)
            {
                slots.Add(new AvailableSlotResponse(
                    current.ToString("HH:mm"),
                    current.AddMinutes(duration).ToString("HH:mm")));
            }

            current = current.AddMinutes(15); // 15-minute intervals
        }

        return Ok(slots);
    }

    private async Task CreateInvoiceForAppointment(Appointment appointment, Service service)
    {
        var brojRacuna = await GenerateBrojRacuna();
        var invoice = new Invoice
        {
            PatientId = appointment.PatientId,
            AppointmentId = appointment.AppointmentId,
            BrojRacuna = brojRacuna,
            PopustProcenat = 0,
            DatumIzdavanja = DateTime.UtcNow,
        };
        var lineTotal = service.Cena;
        invoice.Items.Add(new InvoiceItem
        {
            ServiceId = service.ServiceId,
            JedinicnaCena = service.Cena,
            Kolicina = 1,
            PopustProcenat = 0,
            Iznos = lineTotal,
        });
        invoice.UkupanIznos = lineTotal;
        invoice.IznosZaNaplatu = lineTotal;
        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();
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
