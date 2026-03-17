using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Examinations;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExaminationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ExaminationListResponse>>> GetAll(
        [FromQuery] int? doctorId, [FromQuery] int? patientId,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? status)
    {
        var query = db.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor).ThenInclude(d => d.User)
            .Include(e => e.Diagnosis)
            .AsQueryable();

        if (doctorId.HasValue) query = query.Where(e => e.DoctorId == doctorId.Value);
        if (patientId.HasValue) query = query.Where(e => e.PatientId == patientId.Value);
        if (from.HasValue) query = query.Where(e => e.DatumPregleda >= from.Value);
        if (to.HasValue) query = query.Where(e => e.DatumPregleda <= to.Value);
        if (!string.IsNullOrEmpty(status)) query = query.Where(e => e.Status == status);

        var list = await query.OrderByDescending(e => e.DatumPregleda).ToListAsync();

        return list.Select(e => new ExaminationListResponse(
            e.ExaminationId, e.AppointmentId,
            e.Patient.Ime, e.Patient.Prezime,
            e.Doctor.User.Ime, e.Doctor.User.Prezime,
            e.Diagnosis?.Sifra, e.Diagnosis?.Naziv,
            e.DatumPregleda, e.Status)).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExaminationDetailResponse>> GetById(int id)
    {
        var e = await db.Examinations
            .Include(x => x.Patient)
            .Include(x => x.Doctor).ThenInclude(d => d.User)
            .Include(x => x.Diagnosis)
            .Include(x => x.Therapies)
            .Include(x => x.Referrals)
            .Include(x => x.MedicalReport)
            .FirstOrDefaultAsync(x => x.ExaminationId == id);

        if (e is null) return NotFound();

        return new ExaminationDetailResponse(
            e.ExaminationId, e.AppointmentId,
            e.PatientId, e.Patient.Ime, e.Patient.Prezime,
            e.DoctorId, e.Doctor.User.Ime, e.Doctor.User.Prezime,
            e.Anamneza, e.Simptomi,
            e.DiagnosisId, e.Diagnosis?.Sifra, e.DijagnozaTekst,
            e.Zakljucak, e.Preporuka, e.DatumPregleda, e.Status,
            e.Therapies.Select(t => new TherapyResponse(
                t.TherapyId, t.ExaminationId, t.NazivLeka, t.Doza,
                t.Ucestalost, t.Trajanje, t.Napomena)).ToList(),
            e.Referrals.Select(r => new ReferralResponse(
                r.ReferralId, r.ExaminationId, r.Tip, r.Opis, r.Status)).ToList(),
            e.MedicalReport is null ? null : new MedicalReportResponse(
                e.MedicalReport.MedicalReportId, e.MedicalReport.ExaminationId,
                e.MedicalReport.Sadrzaj, e.MedicalReport.DatumKreiranja,
                e.MedicalReport.Status));
    }

    [HttpPost]
    public async Task<ActionResult<ExaminationDetailResponse>> Create([FromBody] CreateExaminationRequest req)
    {
        var appointment = await db.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Doctor).ThenInclude(d => d.User)
            .Include(a => a.Service)
            .FirstOrDefaultAsync(a => a.AppointmentId == req.AppointmentId);

        if (appointment is null)
            return BadRequest("Termin ne postoji.");

        if (appointment.Status != "zakazan")
            return BadRequest("Pregled se može kreirati samo za zakazan termin.");

        var existing = await db.Examinations.AnyAsync(e => e.AppointmentId == req.AppointmentId);
        if (existing)
            return BadRequest("Pregled za ovaj termin već postoji.");

        appointment.Status = "realizovan";

        var exam = new Examination
        {
            AppointmentId = appointment.AppointmentId,
            DoctorId = appointment.DoctorId,
            PatientId = appointment.PatientId,
            DatumPregleda = DateTime.UtcNow,
            Status = "u_toku"
        };

        db.Examinations.Add(exam);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = exam.ExaminationId },
            new ExaminationDetailResponse(
                exam.ExaminationId, exam.AppointmentId,
                exam.PatientId, appointment.Patient.Ime, appointment.Patient.Prezime,
                exam.DoctorId, appointment.Doctor.User.Ime, appointment.Doctor.User.Prezime,
                null, null, null, null, null, null, null,
                exam.DatumPregleda, exam.Status, [], [], null));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExaminationDetailResponse>> Update(int id, [FromBody] UpdateExaminationRequest req)
    {
        var exam = await db.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor).ThenInclude(d => d.User)
            .Include(e => e.Diagnosis)
            .Include(e => e.Therapies)
            .Include(e => e.Referrals)
            .Include(e => e.MedicalReport)
            .FirstOrDefaultAsync(e => e.ExaminationId == id);

        if (exam is null) return NotFound();
        if (exam.Status == "zavrsen")
            return BadRequest("Završen pregled se ne može menjati.");

        exam.Anamneza = req.Anamneza;
        exam.Simptomi = req.Simptomi;
        exam.DiagnosisId = req.DiagnosisId;
        exam.DijagnozaTekst = req.DijagnozaTekst;
        exam.Zakljucak = req.Zakljucak;
        exam.Preporuka = req.Preporuka;

        await db.SaveChangesAsync();

        return new ExaminationDetailResponse(
            exam.ExaminationId, exam.AppointmentId,
            exam.PatientId, exam.Patient.Ime, exam.Patient.Prezime,
            exam.DoctorId, exam.Doctor.User.Ime, exam.Doctor.User.Prezime,
            exam.Anamneza, exam.Simptomi,
            exam.DiagnosisId, exam.Diagnosis?.Sifra, exam.DijagnozaTekst,
            exam.Zakljucak, exam.Preporuka, exam.DatumPregleda, exam.Status,
            exam.Therapies.Select(t => new TherapyResponse(
                t.TherapyId, t.ExaminationId, t.NazivLeka, t.Doza,
                t.Ucestalost, t.Trajanje, t.Napomena)).ToList(),
            exam.Referrals.Select(r => new ReferralResponse(
                r.ReferralId, r.ExaminationId, r.Tip, r.Opis, r.Status)).ToList(),
            exam.MedicalReport is null ? null : new MedicalReportResponse(
                exam.MedicalReport.MedicalReportId, exam.MedicalReport.ExaminationId,
                exam.MedicalReport.Sadrzaj, exam.MedicalReport.DatumKreiranja,
                exam.MedicalReport.Status));
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var exam = await db.Examinations.FindAsync(id);
        if (exam is null) return NotFound();
        if (exam.Status == "zavrsen")
            return BadRequest("Pregled je već završen.");

        exam.Status = "zavrsen";
        await db.SaveChangesAsync();
        return NoContent();
    }
}
