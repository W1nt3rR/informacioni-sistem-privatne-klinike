using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Patients;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PatientsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PatientListResponse>>> GetAll([FromQuery] string? search, [FromQuery] bool? aktivan)
    {
        var query = db.Patients.AsQueryable();

        if (aktivan.HasValue)
            query = query.Where(p => p.Aktivan == aktivan.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p =>
                p.Ime.ToLower().Contains(s) ||
                p.Prezime.ToLower().Contains(s) ||
                p.JMBG.Contains(s) ||
                p.Telefon.Contains(s) ||
                (p.Email != null && p.Email.ToLower().Contains(s)));
        }

        var list = await query
            .OrderBy(p => p.Prezime).ThenBy(p => p.Ime)
            .Select(p => new PatientListResponse(
                p.PatientId, p.Ime, p.Prezime, p.JMBG,
                p.DatumRodjenja.ToString("yyyy-MM-dd"), p.Pol,
                p.Telefon, p.Email, p.Aktivan))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PatientListResponse>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(new List<PatientListResponse>());

        var s = q.Trim().ToLower();
        var list = await db.Patients
            .Where(p => p.Aktivan &&
                (p.Ime.ToLower().Contains(s) ||
                 p.Prezime.ToLower().Contains(s) ||
                 p.JMBG.Contains(s) ||
                 p.Telefon.Contains(s) ||
                 (p.Email != null && p.Email.ToLower().Contains(s))))
            .OrderBy(p => p.Prezime).ThenBy(p => p.Ime)
            .Take(20)
            .Select(p => new PatientListResponse(
                p.PatientId, p.Ime, p.Prezime, p.JMBG,
                p.DatumRodjenja.ToString("yyyy-MM-dd"), p.Pol,
                p.Telefon, p.Email, p.Aktivan))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PatientDetailResponse>> GetById(int id)
    {
        var p = await db.Patients
            .Include(p => p.Allergies)
            .FirstOrDefaultAsync(p => p.PatientId == id);

        if (p == null) return NotFound();

        return Ok(new PatientDetailResponse(
            p.PatientId, p.Ime, p.Prezime, p.JMBG,
            p.DatumRodjenja.ToString("yyyy-MM-dd"), p.Pol,
            p.Adresa, p.Telefon, p.Email, p.BrojOsiguranja, p.Napomene,
            p.DatumRegistracije, p.Aktivan,
            p.Allergies.Select(a => new AllergyResponse(
                a.AllergyId, a.NazivAlergena, a.Opis, a.Ozbiljnost)).ToList()));
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<PatientHistoryResponse>> GetHistory(int id)
    {
        if (!await db.Patients.AnyAsync(p => p.PatientId == id))
            return NotFound();

        var appointments = await db.Appointments
            .Where(a => a.PatientId == id)
            .Include(a => a.Service)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .OrderByDescending(a => a.DatumVreme)
            .Select(a => new PatientAppointmentSummary(
                a.AppointmentId, a.DatumVreme,
                a.Service.Naziv,
                a.Doctor.User.Ime + " " + a.Doctor.User.Prezime,
                a.Status))
            .ToListAsync();

        var examinations = await db.Examinations
            .Where(e => e.PatientId == id)
            .Include(e => e.Doctor).ThenInclude(d => d.User)
            .OrderByDescending(e => e.DatumPregleda)
            .Select(e => new PatientExaminationSummary(
                e.ExaminationId, e.DatumPregleda,
                e.DijagnozaTekst,
                e.Doctor.User.Ime + " " + e.Doctor.User.Prezime,
                e.Status))
            .ToListAsync();

        return Ok(new PatientHistoryResponse(appointments, examinations));
    }

    [HttpPost]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<ActionResult<PatientDetailResponse>> Create(CreatePatientRequest request)
    {
        var entity = new Patient
        {
            Ime = request.Ime,
            Prezime = request.Prezime,
            JMBG = request.JMBG,
            DatumRodjenja = DateOnly.Parse(request.DatumRodjenja),
            Pol = request.Pol,
            Adresa = request.Adresa,
            Telefon = request.Telefon,
            Email = request.Email,
            BrojOsiguranja = request.BrojOsiguranja,
            Napomene = request.Napomene
        };

        db.Patients.Add(entity);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.PatientId },
            new PatientDetailResponse(
                entity.PatientId, entity.Ime, entity.Prezime, entity.JMBG,
                entity.DatumRodjenja.ToString("yyyy-MM-dd"), entity.Pol,
                entity.Adresa, entity.Telefon, entity.Email, entity.BrojOsiguranja,
                entity.Napomene, entity.DatumRegistracije, entity.Aktivan, []));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> Update(int id, UpdatePatientRequest request)
    {
        var entity = await db.Patients.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Ime = request.Ime;
        entity.Prezime = request.Prezime;
        entity.JMBG = request.JMBG;
        entity.DatumRodjenja = DateOnly.Parse(request.DatumRodjenja);
        entity.Pol = request.Pol;
        entity.Adresa = request.Adresa;
        entity.Telefon = request.Telefon;
        entity.Email = request.Email;
        entity.BrojOsiguranja = request.BrojOsiguranja;
        entity.Napomene = request.Napomene;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "admin,recepcija")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var entity = await db.Patients.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Aktivan = !entity.Aktivan;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // --- Allergies sub-resource ---

    [HttpPost("{patientId}/allergies")]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<ActionResult<AllergyResponse>> CreateAllergy(int patientId, CreateAllergyRequest request)
    {
        if (!await db.Patients.AnyAsync(p => p.PatientId == patientId))
            return NotFound();

        var entity = new Allergy
        {
            PatientId = patientId,
            NazivAlergena = request.NazivAlergena,
            Opis = request.Opis,
            Ozbiljnost = request.Ozbiljnost
        };

        db.Allergies.Add(entity);
        await db.SaveChangesAsync();

        return Ok(new AllergyResponse(entity.AllergyId, entity.NazivAlergena, entity.Opis, entity.Ozbiljnost));
    }

    [HttpPut("{patientId}/allergies/{allergyId}")]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<IActionResult> UpdateAllergy(int patientId, int allergyId, UpdateAllergyRequest request)
    {
        var entity = await db.Allergies
            .FirstOrDefaultAsync(a => a.AllergyId == allergyId && a.PatientId == patientId);
        if (entity == null) return NotFound();

        entity.NazivAlergena = request.NazivAlergena;
        entity.Opis = request.Opis;
        entity.Ozbiljnost = request.Ozbiljnost;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{patientId}/allergies/{allergyId}")]
    [Authorize(Roles = "admin,recepcija,lekar")]
    public async Task<IActionResult> DeleteAllergy(int patientId, int allergyId)
    {
        var entity = await db.Allergies
            .FirstOrDefaultAsync(a => a.AllergyId == allergyId && a.PatientId == patientId);
        if (entity == null) return NotFound();

        db.Allergies.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
