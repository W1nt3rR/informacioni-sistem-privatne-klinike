using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Portal;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortalController(
    AppDbContext db,
    UserManager<ApplicationUser> userManager) : ControllerBase
{
    // ─── Self-registration ───────────────────────────────────────────
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] PortalRegisterRequest req)
    {
        if (await userManager.FindByNameAsync(req.UserName) is not null)
            return BadRequest(new { message = "Korisničko ime je zauzeto." });

        var user = new ApplicationUser
        {
            UserName = req.UserName,
            Email = req.Email,
            Ime = req.Ime,
            Prezime = req.Prezime
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

        var roleResult = await userManager.AddToRoleAsync(user, "pacijent");
        if (!roleResult.Succeeded)
            return BadRequest(new { message = "Greška pri dodeli uloge." });

        // Link to existing patient by JMBG or create new
        var patient = await db.Patients.FirstOrDefaultAsync(p => p.JMBG == req.JMBG);
        if (patient is not null)
        {
            patient.UserId = user.Id;
        }
        else
        {
            patient = new Patient
            {
                Ime = req.Ime,
                Prezime = req.Prezime,
                JMBG = req.JMBG,
                DatumRodjenja = req.DatumRodjenja,
                Pol = req.Pol,
                Adresa = req.Adresa,
                Telefon = req.Telefon ?? string.Empty,
                Email = req.Email,
                UserId = user.Id
            };
            db.Patients.Add(patient);
        }

        await db.SaveChangesAsync();

        return Ok(new { message = "Registracija uspešna." });
    }

    // ─── My Appointments ─────────────────────────────────────────────
    [HttpGet("appointments")]
    [Authorize(Roles = "pacijent")]
    public async Task<ActionResult<List<PortalAppointmentResponse>>> MyAppointments()
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var appointments = await db.Appointments
            .Include(a => a.Service)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => a.PatientId == patient.PatientId)
            .OrderByDescending(a => a.DatumVreme)
            .Select(a => new PortalAppointmentResponse(
                a.AppointmentId,
                a.Service.Naziv,
                $"{a.Doctor.User.Ime} {a.Doctor.User.Prezime}",
                a.DatumVreme,
                a.TrajanjeMinuta,
                a.Status))
            .ToListAsync();

        return appointments;
    }

    // ─── Request Appointment ─────────────────────────────────────────
    [HttpPost("appointment-requests")]
    [Authorize(Roles = "pacijent")]
    public async Task<IActionResult> RequestAppointment([FromBody] PortalAppointmentRequest req)
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var service = await db.Services.FindAsync(req.ServiceId);
        if (service is null) return BadRequest(new { message = "Usluga nije pronađena." });

        var doctor = await db.Doctors.FindAsync(req.DoctorId);
        if (doctor is null) return BadRequest(new { message = "Lekar nije pronađen." });

        if (doctor.UserId == User.FindFirstValue(ClaimTypes.NameIdentifier))
            return BadRequest(new { message = "Ne možete zakazati termin kod sebe." });

        var appointment = new Appointment
        {
            PatientId = patient.PatientId,
            DoctorId = req.DoctorId,
            ServiceId = req.ServiceId,
            DatumVreme = req.DatumVreme,
            TrajanjeMinuta = service.TrajanjeMinuta,
            Status = "zahtev",
            RazlogPromene = req.Napomena,
            CreatorId = User.FindFirstValue(ClaimTypes.NameIdentifier)!
        };

        db.Appointments.Add(appointment);
        await db.SaveChangesAsync();

        return Ok(new { message = "Termin uspešno zakazan.", appointmentId = appointment.AppointmentId });
    }

    // ─── My Medical Reports ──────────────────────────────────────────
    [HttpGet("medical-reports")]
    [Authorize(Roles = "pacijent")]
    public async Task<ActionResult<List<PortalMedicalReportResponse>>> MyMedicalReports()
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var reports = await db.MedicalReports
            .Include(r => r.Doctor).ThenInclude(d => d.User)
            .Include(r => r.Examination).ThenInclude(e => e.Appointment).ThenInclude(a => a.Service)
            .Where(r => r.PatientId == patient.PatientId)
            .OrderByDescending(r => r.DatumKreiranja)
            .Select(r => new PortalMedicalReportResponse(
                r.MedicalReportId,
                r.ExaminationId,
                $"{r.Doctor.User.Ime} {r.Doctor.User.Prezime}",
                r.Examination.Appointment.Service.Naziv,
                r.Examination.DatumPregleda,
                r.Examination.DijagnozaTekst,
                r.Examination.Preporuka,
                r.Sadrzaj,
                r.Status == "potpisan"))
            .ToListAsync();

        return reports;
    }

    // ─── My Messages ─────────────────────────────────────────────────
    [HttpGet("messages")]
    [Authorize(Roles = "pacijent")]
    public async Task<ActionResult<List<PortalMessageResponse>>> MyMessages()
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var messages = await db.Messages
            .Where(m =>
                (m.PrimalacTip == "pacijent" && m.PrimalacId == patient.PatientId) ||
                (m.PosiljalacTip == "pacijent" && m.PosiljalacId == patient.PatientId))
            .OrderByDescending(m => m.DatumSlanja)
            .Select(m => new PortalMessageResponse(
                m.MessageId,
                m.PosiljalacTip,
                m.PosiljalacId,
                m.Sadrzaj,
                m.DatumSlanja,
                m.Procitana))
            .ToListAsync();

        return messages;
    }

    [HttpPost("messages")]
    [Authorize(Roles = "pacijent")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest req)
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var message = new Message
        {
            PosiljalacTip = "pacijent",
            PosiljalacId = patient.PatientId,
            PrimalacTip = "recepcija",
            PrimalacId = patient.PatientId, // used as reference back to the patient
            Sadrzaj = req.Sadrzaj,
            DatumSlanja = DateTime.UtcNow
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync();

        return Ok(new { message = "Poruka poslata." });
    }

    // ─── Helper ──────────────────────────────────────────────────────
    private async Task<Patient?> GetCurrentPatient()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return null;
        return await db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
    }
}
