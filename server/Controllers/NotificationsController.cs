using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Notifications;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? tip,
        [FromQuery] string? status,
        [FromQuery] string? primalacTip)
    {
        var q = db.Notifications.AsQueryable();

        if (!string.IsNullOrEmpty(tip))
            q = q.Where(n => n.Tip == tip);
        if (!string.IsNullOrEmpty(status))
            q = q.Where(n => n.Status == status);
        if (!string.IsNullOrEmpty(primalacTip))
            q = q.Where(n => n.PrimalacTip == primalacTip);

        var notifications = await q.OrderByDescending(n => n.DatumSlanja).ToListAsync();

        var patientIds = notifications.Where(n => n.PrimalacTip == "pacijent").Select(n => n.PrimalacId).Distinct();
        var doctorIds = notifications.Where(n => n.PrimalacTip == "lekar").Select(n => n.PrimalacId).Distinct();

        var patients = await db.Patients
            .Where(p => patientIds.Contains(p.PatientId))
            .ToDictionaryAsync(p => p.PatientId, p => $"{p.Ime} {p.Prezime}");

        var doctors = await db.Doctors.Include(d => d.User)
            .Where(d => doctorIds.Contains(d.DoctorId))
            .ToDictionaryAsync(d => d.DoctorId, d => $"{d.User.Ime} {d.User.Prezime}");

        return Ok(notifications.Select(n => new NotificationListResponse(
            n.NotificationId, n.Tip, n.PrimalacTip, n.PrimalacId,
            n.PrimalacTip == "pacijent"
                ? patients.GetValueOrDefault(n.PrimalacId, "—")
                : doctors.GetValueOrDefault(n.PrimalacId, "—"),
            n.Sadrzaj, n.DatumSlanja, n.Status, n.AppointmentId)));
    }

    [HttpPost]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> Create(CreateNotificationRequest req)
    {
        var notification = new Notification
        {
            Tip = req.Tip,
            PrimalacTip = req.PrimalacTip,
            PrimalacId = req.PrimalacId,
            Sadrzaj = req.Sadrzaj,
            DatumSlanja = DateTime.UtcNow,
            Status = "ceka",
            AppointmentId = req.AppointmentId
        };

        db.Notifications.Add(notification);
        await db.SaveChangesAsync();

        return CreatedAtAction(null, null, new { notification.NotificationId });
    }

    [HttpPatch("{id}/send")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> Send(int id)
    {
        var notification = await db.Notifications.FindAsync(id);
        if (notification == null) return NotFound();

        notification.Status = "poslato";
        notification.DatumSlanja = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("generate-reminders")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> GenerateReminders()
    {
        var tomorrow = DateTime.UtcNow.Date.AddDays(1);
        var dayAfter = tomorrow.AddDays(1);

        var appointments = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .Where(a => a.Status == "zakazan"
                && a.DatumVreme >= tomorrow
                && a.DatumVreme < dayAfter)
            .ToListAsync();

        var existingAppointmentIds = await db.Notifications
            .Where(n => n.Tip == "podsetnik"
                && n.AppointmentId != null
                && appointments.Select(a => a.AppointmentId).Contains(n.AppointmentId!.Value))
            .Select(n => n.AppointmentId)
            .ToListAsync();

        var newNotifications = new List<Notification>();

        foreach (var a in appointments.Where(a => !existingAppointmentIds.Contains(a.AppointmentId)))
        {
            // Patient reminder
            newNotifications.Add(new Notification
            {
                Tip = "podsetnik",
                PrimalacTip = "pacijent",
                PrimalacId = a.PatientId,
                Sadrzaj = $"Podsetnik: Imate zakazan termin sutra ({a.DatumVreme:dd.MM.yyyy.}) u {a.DatumVreme:HH:mm} za uslugu {a.Service.Naziv} kod dr {a.Doctor.User.Ime} {a.Doctor.User.Prezime}.",
                DatumSlanja = DateTime.UtcNow,
                Status = "ceka",
                AppointmentId = a.AppointmentId
            });

            // Doctor daily schedule notification
            newNotifications.Add(new Notification
            {
                Tip = "raspored",
                PrimalacTip = "lekar",
                PrimalacId = a.DoctorId,
                Sadrzaj = $"Termin sutra u {a.DatumVreme:HH:mm}: {a.Patient.Ime} {a.Patient.Prezime} – {a.Service.Naziv}.",
                DatumSlanja = DateTime.UtcNow,
                Status = "ceka",
                AppointmentId = a.AppointmentId
            });
        }

        db.Notifications.AddRange(newNotifications);
        await db.SaveChangesAsync();

        return Ok(new { generated = newNotifications.Count });
    }
}
