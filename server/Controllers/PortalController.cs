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

        // Check if JMBG already has a linked user account
        var existingPatient = await db.Patients.FirstOrDefaultAsync(p => p.JMBG == req.JMBG);
        if (existingPatient is not null && existingPatient.UserId is not null)
            return BadRequest(new { message = "Pacijent sa ovim JMBG-om već ima korisnički nalog." });

        var user = new ApplicationUser
        {
            UserName = req.UserName,
            Email = req.Email,
            Ime = req.Ime,
            Prezime = req.Prezime
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Code switch
            {
                "PasswordTooShort" => "Lozinka mora imati najmanje 6 karaktera.",
                "PasswordRequiresUpper" => "Lozinka mora sadržati veliko slovo.",
                "PasswordRequiresLower" => "Lozinka mora sadržati malo slovo.",
                "PasswordRequiresDigit" => "Lozinka mora sadržati cifru.",
                "DuplicateUserName" => "Korisničko ime je zauzeto.",
                _ => e.Description
            });
            return BadRequest(new { message = string.Join(" ", errors) });
        }

        var roleResult = await userManager.AddToRoleAsync(user, "pacijent");
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return BadRequest(new { message = "Greška pri dodeli uloge." });
        }

        // Link to existing patient by JMBG or create new
        if (existingPatient is not null)
        {
            existingPatient.UserId = user.Id;
        }
        else
        {
            var patient = new Patient
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

    // ─── Dashboard ───────────────────────────────────────────────────
    [HttpGet("dashboard")]
    [Authorize(Roles = "pacijent")]
    public async Task<IActionResult> Dashboard()
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var now = DateTime.UtcNow;

        var appointments = await db.Appointments
            .Include(a => a.Service)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Where(a => a.PatientId == patient.PatientId)
            .ToListAsync();

        var upcoming = appointments.Where(a => a.DatumVreme >= now && a.Status is "zakazan" or "zahtev").ToList();
        var past = appointments.Where(a => a.DatumVreme < now).ToList();

        var nextAppointment = upcoming
            .OrderBy(a => a.DatumVreme)
            .Select(a => new
            {
                a.AppointmentId,
                ServiceName = a.Service.Naziv,
                DoctorName = $"{a.Doctor.User.Ime} {a.Doctor.User.Prezime}",
                a.DatumVreme,
                a.Status
            })
            .FirstOrDefault();

        var invoices = await db.Invoices
            .Include(i => i.Payments)
            .Where(i => i.PatientId == patient.PatientId)
            .ToListAsync();

        var unpaid = invoices.Where(i => i.StatusNaplate != "placeno").ToList();

        var recentInvoices = unpaid
            .OrderByDescending(i => i.DatumIzdavanja)
            .Take(5)
            .Select(i => new
            {
                i.InvoiceId,
                i.BrojRacuna,
                i.IznosZaNaplatu,
                i.StatusNaplate,
                i.DatumIzdavanja
            })
            .ToList();

        var totalDebt = unpaid.Sum(i => i.IznosZaNaplatu - i.Payments.Sum(p => p.Iznos));

        var reportsCount = await db.MedicalReports
            .CountAsync(r => r.PatientId == patient.PatientId);

        var unreadMessages = await db.Messages
            .CountAsync(m => m.PrimalacTip == "pacijent" && m.PrimalacId == patient.PatientId && !m.Procitana);

        return Ok(new
        {
            UpcomingAppointments = upcoming.Count,
            PastAppointments = past.Count,
            UnpaidInvoices = unpaid.Count,
            TotalDebt = totalDebt,
            ReportsCount = reportsCount,
            UnreadMessages = unreadMessages,
            NextAppointment = nextAppointment,
            RecentInvoices = recentInvoices
        });
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

        if (req.DatumVreme < DateTime.Now)
            return BadRequest(new { message = "Ne možete podneti zahtev za termin u prošlosti." });

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

        return Ok(new { message = "Zahtev za termin je uspešno poslat.", appointmentId = appointment.AppointmentId });
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

    // ─── My Invoices ───────────────────────────────────────────────
    [HttpGet("invoices")]
    [Authorize(Roles = "pacijent")]
    public async Task<ActionResult<List<PortalInvoiceListResponse>>> MyInvoices()
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var invoices = await db.Invoices
            .Include(i => i.Payments)
            .Where(i => i.PatientId == patient.PatientId)
            .OrderByDescending(i => i.DatumIzdavanja)
            .Select(i => new PortalInvoiceListResponse(
                i.InvoiceId,
                i.BrojRacuna,
                i.DatumIzdavanja,
                i.UkupanIznos,
                i.PopustProcenat,
                i.IznosZaNaplatu,
                i.StatusNaplate,
                i.Payments.Sum(p => p.Iznos)))
            .ToListAsync();

        return invoices;
    }

    [HttpGet("invoices/{id:int}")]
    [Authorize(Roles = "pacijent")]
    public async Task<ActionResult<PortalInvoiceDetailResponse>> GetInvoice(int id)
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var inv = await db.Invoices
            .Include(i => i.Items).ThenInclude(it => it.Service)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == id && i.PatientId == patient.PatientId);

        if (inv is null) return NotFound(new { message = "Račun nije pronađen." });

        return new PortalInvoiceDetailResponse(
            inv.InvoiceId, inv.BrojRacuna, inv.DatumIzdavanja,
            inv.UkupanIznos, inv.PopustProcenat, inv.IznosZaNaplatu,
            inv.StatusNaplate, inv.Napomena,
            inv.Payments.Sum(p => p.Iznos),
            inv.Items.Select(it => new PortalInvoiceItemResponse(
                it.Service.Naziv, it.Kolicina, it.JedinicnaCena, it.Iznos)).ToList(),
            inv.Payments.OrderByDescending(p => p.DatumPlacanja)
                .Select(p => new PortalPaymentResponse(p.Iznos, p.NacinPlacanja, p.DatumPlacanja)).ToList());
    }

    [HttpPost("invoices/{id:int}/pay")]
    [Authorize(Roles = "pacijent")]
    public async Task<IActionResult> PayInvoice(int id, [FromBody] PortalPayInvoiceRequest req)
    {
        var patient = await GetCurrentPatient();
        if (patient is null) return NotFound(new { message = "Pacijent nije pronađen." });

        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == id && i.PatientId == patient.PatientId);

        if (invoice is null) return NotFound(new { message = "Račun nije pronađen." });
        if (invoice.StatusNaplate == "placeno")
            return BadRequest(new { message = "Račun je već plaćen." });

        var totalPaid = invoice.Payments.Sum(p => p.Iznos) + req.Iznos;
        if (totalPaid > invoice.IznosZaNaplatu)
            return BadRequest(new { message = "Iznos premašuje dugovanje." });

        var payment = new Payment
        {
            InvoiceId = id,
            Iznos = req.Iznos,
            NacinPlacanja = req.NacinPlacanja,
            DatumPlacanja = DateTime.UtcNow
        };
        db.Payments.Add(payment);

        invoice.StatusNaplate = totalPaid >= invoice.IznosZaNaplatu ? "placeno" : "delimicno";
        await db.SaveChangesAsync();

        return Ok(new { message = "Uplata uspešno evidentirana." });
    }

    // ─── Helper ──────────────────────────────────────────────────────
    private async Task<Patient?> GetCurrentPatient()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return null;
        return await db.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
    }
}
