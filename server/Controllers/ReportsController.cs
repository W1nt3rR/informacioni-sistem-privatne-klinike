using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "admin,menadzer,recepcija,lekar")]
public class ReportsController(AppDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        var patientCount = await db.Patients.CountAsync(p => p.Aktivan);
        var doctorCount = await db.Doctors.CountAsync(d => d.Aktivan);

        var todayAppointments = await db.Appointments
            .Where(a => a.DatumVreme >= today && a.DatumVreme < tomorrow)
            .CountAsync();

        var unpaidInvoices = await db.Invoices
            .Where(i => i.StatusNaplate == "neplaceno" || i.StatusNaplate == "delimicno")
            .CountAsync();

        var waitingListCount = await db.WaitingListItems
            .CountAsync(w => w.Status == "ceka");

        var todayRevenue = await db.Payments
            .Where(p => p.DatumPlacanja >= today && p.DatumPlacanja < tomorrow)
            .SumAsync(p => (decimal?)p.Iznos) ?? 0;

        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthRevenue = await db.Payments
            .Where(p => p.DatumPlacanja >= monthStart && p.DatumPlacanja < tomorrow)
            .SumAsync(p => (decimal?)p.Iznos) ?? 0;

        var upcomingAppointments = await db.Appointments
            .Where(a => a.DatumVreme >= today && a.DatumVreme < tomorrow && a.Status == "zakazan")
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .OrderBy(a => a.DatumVreme)
            .Take(10)
            .Select(a => new
            {
                a.AppointmentId,
                Pacijent = a.Patient.Ime + " " + a.Patient.Prezime,
                Lekar = a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
                Usluga = a.Service.Naziv,
                a.DatumVreme,
                a.Status
            })
            .ToListAsync();

        var recentInvoices = await db.Invoices
            .Where(i => i.StatusNaplate == "neplaceno" || i.StatusNaplate == "delimicno")
            .Include(i => i.Patient)
            .OrderByDescending(i => i.DatumIzdavanja)
            .Take(5)
            .Select(i => new
            {
                i.InvoiceId,
                i.BrojRacuna,
                Pacijent = i.Patient.Ime + " " + i.Patient.Prezime,
                i.IznosZaNaplatu,
                i.StatusNaplate,
                i.DatumIzdavanja
            })
            .ToListAsync();

        return Ok(new
        {
            patientCount,
            doctorCount,
            todayAppointments,
            unpaidInvoices,
            waitingListCount,
            todayRevenue,
            monthRevenue,
            upcomingAppointments,
            recentInvoices
        });
    }

    [HttpGet("examinations")]
    [Authorize(Roles = "admin,menadzer")]
    public async Task<IActionResult> ExaminationReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? doctorId,
        [FromQuery] int? serviceId)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var q = db.Examinations
            .Include(e => e.Appointment).ThenInclude(a => a.Service)
            .Include(e => e.Doctor).ThenInclude(d => d.User)
            .Where(e => e.DatumPregleda >= fromDate && e.DatumPregleda <= toDate);

        if (doctorId.HasValue)
            q = q.Where(e => e.DoctorId == doctorId.Value);
        if (serviceId.HasValue)
            q = q.Where(e => e.Appointment.ServiceId == serviceId.Value);

        var byDoctor = await q
            .GroupBy(e => new { e.DoctorId, e.Doctor.User.Ime, e.Doctor.User.Prezime })
            .Select(g => new
            {
                g.Key.DoctorId,
                DoctorName = g.Key.Ime + " " + g.Key.Prezime,
                Count = g.Count(),
                Completed = g.Count(e => e.Status == "zavrsen"),
                Cancelled = g.Count(e => e.Status == "otkazan")
            }).ToListAsync();

        var byService = await q
            .GroupBy(e => new { e.Appointment.ServiceId, e.Appointment.Service.Naziv })
            .Select(g => new
            {
                g.Key.ServiceId,
                ServiceName = g.Key.Naziv,
                Count = g.Count()
            }).ToListAsync();

        var totalCount = await q.CountAsync();

        return Ok(new
        {
            from = fromDate,
            to = toDate,
            totalCount,
            byDoctor,
            byService
        });
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> RevenueReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? serviceId)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var paymentsQ = db.Payments
            .Where(p => p.DatumPlacanja >= fromDate && p.DatumPlacanja <= toDate);

        var totalRevenue = await paymentsQ.SumAsync(p => (decimal?)p.Iznos) ?? 0;
        var paymentCount = await paymentsQ.CountAsync();

        var daily = await paymentsQ
            .GroupBy(p => p.DatumPlacanja.Date)
            .Select(g => new
            {
                Date = g.Key,
                Revenue = g.Sum(p => p.Iznos),
                Count = g.Count()
            })
            .OrderBy(d => d.Date)
            .ToListAsync();

        var invoicesQ = db.Invoices
            .Include(i => i.Items).ThenInclude(it => it.Service)
            .Where(i => i.DatumIzdavanja >= fromDate && i.DatumIzdavanja <= toDate);

        var byService = await db.InvoiceItems
            .Include(it => it.Service)
            .Include(it => it.Invoice)
            .Where(it => it.Invoice.DatumIzdavanja >= fromDate && it.Invoice.DatumIzdavanja <= toDate)
            .GroupBy(it => new { it.ServiceId, it.Service.Naziv })
            .Select(g => new
            {
                g.Key.ServiceId,
                ServiceName = g.Key.Naziv,
                Revenue = g.Sum(it => it.Iznos),
                Count = g.Sum(it => it.Kolicina)
            }).ToListAsync();

        if (serviceId.HasValue)
            byService = byService.Where(s => s.ServiceId == serviceId.Value).ToList();

        return Ok(new
        {
            from = fromDate,
            to = toDate,
            totalRevenue,
            paymentCount,
            daily,
            byService
        });
    }

    [HttpGet("cancellations")]
    public async Task<IActionResult> CancellationReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var cancelled = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Service)
            .Where(a => a.DatumVreme >= fromDate && a.DatumVreme <= toDate
                && (a.Status == "otkazao_pacijent" || a.Status == "otkazala_klinika" || a.Status == "nije_se_pojavio"))
            .Select(a => new
            {
                a.AppointmentId,
                Patient = a.Patient.Ime + " " + a.Patient.Prezime,
                Service = a.Service.Naziv,
                a.DatumVreme,
                a.Status,
                a.RazlogOtkazivanja
            })
            .OrderByDescending(a => a.DatumVreme)
            .ToListAsync();

        var byType = cancelled.GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToList();

        return Ok(new
        {
            from = fromDate,
            to = toDate,
            totalCancellations = cancelled.Count,
            byType,
            details = cancelled
        });
    }

    [HttpGet("utilization")]
    public async Task<IActionResult> UtilizationReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var appointments = db.Appointments
            .Where(a => a.DatumVreme >= fromDate && a.DatumVreme <= toDate);

        var byOffice = await appointments
            .Include(a => a.Office)
            .GroupBy(a => new { a.OfficeId, a.Office.Naziv })
            .Select(g => new
            {
                g.Key.OfficeId,
                OfficeName = g.Key.Naziv,
                TotalAppointments = g.Count(),
                Completed = g.Count(a => a.Status == "realizovan"),
                Cancelled = g.Count(a => a.Status == "otkazao_pacijent"
                    || a.Status == "otkazala_klinika" || a.Status == "nije_se_pojavio")
            }).ToListAsync();

        var byDoctor = await appointments
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .GroupBy(a => new { a.DoctorId, a.Doctor.User.Ime, a.Doctor.User.Prezime })
            .Select(g => new
            {
                g.Key.DoctorId,
                DoctorName = g.Key.Ime + " " + g.Key.Prezime,
                TotalAppointments = g.Count(),
                Completed = g.Count(a => a.Status == "realizovan"),
                TotalMinutes = g.Sum(a => a.TrajanjeMinuta)
            }).ToListAsync();

        return Ok(new
        {
            from = fromDate,
            to = toDate,
            byOffice,
            byDoctor
        });
    }

    [HttpGet("popular-services")]
    public async Task<IActionResult> PopularServicesReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var services = await db.Appointments
            .Include(a => a.Service)
            .Where(a => a.DatumVreme >= fromDate && a.DatumVreme <= toDate)
            .GroupBy(a => new { a.ServiceId, a.Service.Naziv, a.Service.Cena })
            .Select(g => new
            {
                g.Key.ServiceId,
                ServiceName = g.Key.Naziv,
                g.Key.Cena,
                AppointmentCount = g.Count(),
                Revenue = g.Count() * g.Key.Cena
            })
            .OrderByDescending(s => s.AppointmentCount)
            .ToListAsync();

        return Ok(new
        {
            from = fromDate,
            to = toDate,
            services
        });
    }
}
