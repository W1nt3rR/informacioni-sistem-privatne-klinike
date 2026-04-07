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
[Authorize(Roles = "admin,recepcija,lekar")]
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
            .Include(a => a.Examination)
            .Include(a => a.AppointmentServices).ThenInclude(aps => aps.Service)
            .AsQueryable();

        if (from.HasValue) query = query.Where(a => a.DatumVreme >= from.Value);
        if (to.HasValue) query = query.Where(a => a.DatumVreme <= to.Value);
        if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId.Value);
        if (officeId.HasValue) query = query.Where(a => a.OfficeId == officeId.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(a => a.Status == status);

        var appointments = await query.OrderBy(a => a.DatumVreme).ToListAsync();

        var list = appointments.Select(a => new AppointmentListResponse(
            a.AppointmentId, a.PatientId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.DoctorId,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.ServiceId,
            a.AppointmentServices.Count > 0
                ? string.Join(", ", a.AppointmentServices.Select(s => s.Service.Naziv))
                : a.Service.Naziv,
            a.OfficeId,
            a.Office != null ? a.Office.Naziv : "—",
            a.DatumVreme, a.TrajanjeMinuta, a.Status,
            a.Examination != null ? a.Examination.ExaminationId : null,
            a.AppointmentServices.Count > 0
                ? a.AppointmentServices.Select(s => s.ServiceId).ToList()
                : [a.ServiceId]
        )).ToList();

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
            .Include(a => a.AppointmentServices).ThenInclude(aps => aps.Service)
            .FirstOrDefaultAsync(a => a.AppointmentId == id);

        if (a == null) return NotFound();

        return Ok(new AppointmentDetailResponse(
            a.AppointmentId, a.PatientId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.DoctorId,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.ServiceId,
            a.AppointmentServices.Count > 0
                ? string.Join(", ", a.AppointmentServices.Select(s => s.Service.Naziv))
                : a.Service.Naziv,
            a.OfficeId,
            a.Office != null ? a.Office.Naziv : "—",
            a.DatumVreme, a.TrajanjeMinuta, a.Status,
            a.RazlogPromene, a.RazlogOtkazivanja,
            a.Creator != null ? a.Creator.Ime + " " + a.Creator.Prezime : "—",
            a.DatumKreiranja,
            a.AppointmentServices.Count > 0
                ? a.AppointmentServices.Select(s => s.ServiceId).ToList()
                : [a.ServiceId]
        ));
    }

    [HttpPost]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<ActionResult<AppointmentDetailResponse>> Create(CreateAppointmentRequest req)
    {
        if (req.ServiceIds == null || req.ServiceIds.Count == 0)
            return BadRequest("Morate odabrati barem jednu uslugu.");

        var distinctIds = req.ServiceIds.Distinct().ToList();
        var services = await db.Services.Where(s => distinctIds.Contains(s.ServiceId)).ToListAsync();
        if (services.Count != distinctIds.Count)
            return BadRequest("Jedna ili više usluga ne postoji.");

        if (req.DatumVreme < DateTime.Now)
            return BadRequest("Ne možete zakazati termin u prošlosti.");

        var trajanje = services.Sum(s => s.TrajanjeMinuta);
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

        var nonBlockingStatuses = new[] { "otkazao_pacijent", "otkazala_klinika", "nije_se_pojavio", "zahtev" };

        // Conflict: doctor busy
        var doctorBusy = await db.Appointments.AnyAsync(a =>
            a.DoctorId == req.DoctorId &&
            !nonBlockingStatuses.Contains(a.Status) &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (doctorBusy) return BadRequest("Lekar je zauzet u odabranom terminu.");

        // Conflict: office busy
        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == req.OfficeId &&
            !nonBlockingStatuses.Contains(a.Status) &&
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
            ServiceId = distinctIds[0],
            OfficeId = req.OfficeId,
            DatumVreme = req.DatumVreme,
            TrajanjeMinuta = trajanje,
            CreatorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!,
        };

        foreach (var svcId in distinctIds)
            appointment.AppointmentServices.Add(new AppointmentService { ServiceId = svcId });

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

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

        var trajanje = appointment.TrajanjeMinuta;
        var kraj = req.DatumVreme.AddMinutes(trajanje);
        var officeId = req.OfficeId ?? appointment.OfficeId;
        if (!officeId.HasValue)
            return BadRequest("Ordinacija mora biti dodeljena pre pomeranja termina.");

        var nonBlockingStatuses = new[] { "otkazao_pacijent", "otkazala_klinika", "nije_se_pojavio", "zahtev" };

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
            !nonBlockingStatuses.Contains(a.Status) &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (doctorBusy) return BadRequest("Lekar je zauzet u odabranom terminu.");

        // Conflict: office busy (exclude this appointment)
        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == officeId.Value && a.AppointmentId != id &&
            !nonBlockingStatuses.Contains(a.Status) &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > req.DatumVreme);
        if (officeBusy) return BadRequest("Ordinacija je zauzeta u odabranom terminu.");

        appointment.DatumVreme = req.DatumVreme;
        appointment.OfficeId = officeId.Value;
        appointment.RazlogPromene = req.RazlogPromene;
        await db.SaveChangesAsync();

        return await GetById(id);
    }

    [HttpPatch("{id}/approve")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<ActionResult<AppointmentDetailResponse>> ApproveRequest(int id, ApproveAppointmentRequest req)
    {
        var appointment = await db.Appointments
            .FirstOrDefaultAsync(a => a.AppointmentId == id);

        if (appointment == null) return NotFound();
        if (appointment.Status != "zahtev")
            return BadRequest("Samo zahtevi za termin mogu biti odobreni.");
        if (appointment.DatumVreme < DateTime.Now)
            return BadRequest("Ne možete odobriti zahtev za termin u prošlosti.");

        var office = await db.Offices.FirstOrDefaultAsync(o => o.OfficeId == req.OfficeId && o.Dostupna);
        if (office == null)
            return BadRequest("Ordinacija nije pronađena ili nije dostupna.");

        var trajanje = appointment.TrajanjeMinuta;
        var kraj = appointment.DatumVreme.AddMinutes(trajanje);
        var nonBlockingStatuses = new[] { "otkazao_pacijent", "otkazala_klinika", "nije_se_pojavio", "zahtev" };

        var dateOnly = DateOnly.FromDateTime(appointment.DatumVreme);
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return BadRequest("Odabrani datum je neradni dan.");

        var dayOfWeek = (int)appointment.DatumVreme.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == appointment.DoctorId && w.DanUNedelji == dayOfWeek);
        if (wh == null) return BadRequest("Lekar ne radi tog dana.");

        var timeStart = TimeOnly.FromDateTime(appointment.DatumVreme);
        var timeEnd = TimeOnly.FromDateTime(kraj);
        if (timeStart < wh.VremeOd || timeEnd > wh.VremeDo)
            return BadRequest("Termin je van radnog vremena lekara.");

        var doctorBusy = await db.Appointments.AnyAsync(a =>
            a.DoctorId == appointment.DoctorId && a.AppointmentId != id &&
            !nonBlockingStatuses.Contains(a.Status) &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > appointment.DatumVreme);
        if (doctorBusy) return BadRequest("Lekar je zauzet u odabranom terminu.");

        var officeBusy = await db.Appointments.AnyAsync(a =>
            a.OfficeId == req.OfficeId && a.AppointmentId != id &&
            !nonBlockingStatuses.Contains(a.Status) &&
            a.DatumVreme < kraj &&
            a.DatumVreme.AddMinutes(a.TrajanjeMinuta) > appointment.DatumVreme);
        if (officeBusy) return BadRequest("Ordinacija je zauzeta u odabranom terminu.");

        appointment.OfficeId = req.OfficeId;
        appointment.Status = "zakazan";
        appointment.RazlogOtkazivanja = null;
        await db.SaveChangesAsync();

        return await GetById(id);
    }

    [HttpPatch("{id}/reject")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> RejectRequest(int id, RejectAppointmentRequest req)
    {
        var appointment = await db.Appointments.FindAsync(id);
        if (appointment == null) return NotFound();
        if (appointment.Status != "zahtev")
            return BadRequest("Samo zahtevi za termin mogu biti odbijeni.");

        appointment.Status = "otkazala_klinika";
        appointment.RazlogOtkazivanja = req.RazlogOtkazivanja;
        await db.SaveChangesAsync();

        return NoContent();
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
            .Where(a => a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "zahtev");

        if (doctorId.HasValue) query = query.Where(a => a.DoctorId == doctorId.Value);

        var list = await query.OrderBy(a => a.DatumVreme).Select(a => new CalendarAppointmentResponse(
            a.AppointmentId,
            a.Patient.Ime + " " + a.Patient.Prezime,
            a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
            a.Service.Naziv,
            a.Office != null ? a.Office.Naziv : "—",
            a.DatumVreme, a.TrajanjeMinuta, a.Status
        )).ToListAsync();

        return Ok(list);
    }

    [HttpGet("available-slots")]
    public async Task<ActionResult<List<AvailableSlotResponse>>> AvailableSlots(
        [FromQuery] int doctorId, [FromQuery] int? serviceId, [FromQuery] string? serviceIds, [FromQuery] string date, [FromQuery] int? officeId)
    {
        if (!DateOnly.TryParse(date, out var dateOnly))
            return BadRequest("Nevažeći format datuma.");

        // Parse service IDs from either parameter
        var svcIds = new List<int>();
        if (!string.IsNullOrEmpty(serviceIds))
            svcIds = serviceIds.Split(',').Select(int.Parse).Distinct().ToList();
        else if (serviceId.HasValue)
            svcIds = [serviceId.Value];

        if (svcIds.Count == 0)
            return BadRequest("Morate odabrati barem jednu uslugu.");

        var svcs = await db.Services.Where(s => svcIds.Contains(s.ServiceId)).ToListAsync();
        if (svcs.Count == 0) return BadRequest("Usluga ne postoji.");
        var duration = svcs.Sum(s => s.TrajanjeMinuta);

        // Check non-working day
        var isNonWorking = await db.NonWorkingDays.AnyAsync(n => n.Datum == dateOnly);
        if (isNonWorking) return Ok(new List<AvailableSlotResponse>());

        // Get working hours for that day
        var dayOfWeek = (int)dateOnly.DayOfWeek;
        if (dayOfWeek == 0) dayOfWeek = 7;
        var wh = await db.WorkingHours.FirstOrDefaultAsync(w =>
            w.DoctorId == doctorId && w.DanUNedelji == dayOfWeek);
        if (wh == null) return Ok(new List<AvailableSlotResponse>());

        // Get existing appointments for that doctor on that date
        var dateStart = dateOnly.ToDateTime(TimeOnly.MinValue);
        var dateEnd = dateOnly.ToDateTime(TimeOnly.MaxValue);
        var existing = await db.Appointments
            .Where(a => a.DoctorId == doctorId &&
                        a.DatumVreme >= dateStart && a.DatumVreme <= dateEnd &&
                        a.Status != "otkazao_pacijent" && a.Status != "otkazala_klinika" && a.Status != "nije_se_pojavio" && a.Status != "zahtev")
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
}
