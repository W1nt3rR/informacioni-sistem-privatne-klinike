using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Examinations;
using PrivateClinic.API.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/medical-reports")]
[Authorize(Roles = "admin,lekar")]
public class MedicalReportsController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<MedicalReportResponse>> Create([FromBody] CreateMedicalReportRequest req,
        [FromQuery] int examinationId)
    {
        var exam = await db.Examinations
            .Include(e => e.MedicalReport)
            .FirstOrDefaultAsync(e => e.ExaminationId == examinationId);

        if (exam is null) return NotFound("Pregled ne postoji.");
        if (exam.MedicalReport is not null)
            return BadRequest("Izveštaj za ovaj pregled već postoji.");

        var report = new MedicalReport
        {
            ExaminationId = examinationId,
            PatientId = exam.PatientId,
            DoctorId = exam.DoctorId,
            Sadrzaj = req.Sadrzaj,
            DatumKreiranja = DateTime.UtcNow,
            Status = "kreiran"
        };

        db.MedicalReports.Add(report);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = report.MedicalReportId },
            new MedicalReportResponse(report.MedicalReportId, report.ExaminationId,
                report.Sadrzaj, report.DatumKreiranja, report.Status));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MedicalReportResponse>> GetById(int id)
    {
        var report = await db.MedicalReports.FindAsync(id);
        if (report is null) return NotFound();

        return new MedicalReportResponse(report.MedicalReportId, report.ExaminationId,
            report.Sadrzaj, report.DatumKreiranja, report.Status);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MedicalReportResponse>> Update(int id, [FromBody] UpdateMedicalReportRequest req)
    {
        var report = await db.MedicalReports.FindAsync(id);
        if (report is null) return NotFound();
        if (report.Status == "potpisan")
            return BadRequest("Potpisan izveštaj se ne može menjati.");

        report.Sadrzaj = req.Sadrzaj;
        await db.SaveChangesAsync();

        return new MedicalReportResponse(report.MedicalReportId, report.ExaminationId,
            report.Sadrzaj, report.DatumKreiranja, report.Status);
    }

    [HttpPatch("{id}/sign")]
    public async Task<IActionResult> Sign(int id)
    {
        var report = await db.MedicalReports.FindAsync(id);
        if (report is null) return NotFound();
        if (report.Status == "potpisan")
            return BadRequest("Izveštaj je već potpisan.");

        report.Status = "potpisan";
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GeneratePdf(int id)
    {
        var report = await db.MedicalReports
            .Include(r => r.Examination)
                .ThenInclude(e => e.Patient)
            .Include(r => r.Examination)
                .ThenInclude(e => e.Diagnosis)
            .Include(r => r.Examination)
                .ThenInclude(e => e.Therapies)
            .Include(r => r.Examination)
                .ThenInclude(e => e.Referrals)
            .Include(r => r.Doctor).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(r => r.MedicalReportId == id);

        if (report is null) return NotFound();

        var exam = report.Examination;
        var patient = exam.Patient;
        var doctor = report.Doctor;

        QuestPDF.Settings.License = LicenseType.Community;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.MarginHorizontal(40);
                page.MarginVertical(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().AlignCenter().Text("Privatna Klinika").Bold().FontSize(18);
                    col.Item().AlignCenter().Text("Medicinski izveštaj").FontSize(14);
                    col.Item().PaddingVertical(5).LineHorizontal(1);
                });

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Item().Text(t =>
                    {
                        t.Span("Datum: ").Bold();
                        t.Span(report.DatumKreiranja.ToString("dd.MM.yyyy"));
                    });
                    col.Item().Text(t =>
                    {
                        t.Span("Status: ").Bold();
                        t.Span(report.Status == "potpisan" ? "Potpisan" : "Kreiran");
                    });

                    col.Item().PaddingTop(15).Text("Podaci o pacijentu").Bold().FontSize(13);
                    col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                    col.Item().Text($"{patient.Ime} {patient.Prezime}");
                    col.Item().Text($"JMBG: {patient.JMBG}");
                    col.Item().Text($"Datum rođenja: {patient.DatumRodjenja:dd.MM.yyyy}");

                    col.Item().PaddingTop(15).Text("Podaci o lekaru").Bold().FontSize(13);
                    col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                    col.Item().Text($"Dr {doctor.User.Ime} {doctor.User.Prezime}");

                    if (!string.IsNullOrEmpty(exam.Anamneza))
                    {
                        col.Item().PaddingTop(15).Text("Anamneza").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Text(exam.Anamneza);
                    }

                    if (!string.IsNullOrEmpty(exam.Simptomi))
                    {
                        col.Item().PaddingTop(10).Text("Simptomi").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Text(exam.Simptomi);
                    }

                    if (exam.Diagnosis is not null || !string.IsNullOrEmpty(exam.DijagnozaTekst))
                    {
                        col.Item().PaddingTop(10).Text("Dijagnoza").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        if (exam.Diagnosis is not null)
                            col.Item().Text($"{exam.Diagnosis.Sifra} - {exam.Diagnosis.Naziv}");
                        if (!string.IsNullOrEmpty(exam.DijagnozaTekst))
                            col.Item().Text(exam.DijagnozaTekst);
                    }

                    if (exam.Therapies.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Terapije").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Lek").Bold();
                                h.Cell().Text("Doza").Bold();
                                h.Cell().Text("Učestalost").Bold();
                                h.Cell().Text("Trajanje").Bold();
                            });
                            foreach (var t in exam.Therapies)
                            {
                                table.Cell().Text(t.NazivLeka);
                                table.Cell().Text(t.Doza);
                                table.Cell().Text(t.Ucestalost);
                                table.Cell().Text(t.Trajanje);
                            }
                        });
                    }

                    if (exam.Referrals.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Uputi").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        foreach (var r in exam.Referrals)
                        {
                            col.Item().Text(t =>
                            {
                                t.Span($"{r.Tip}: ").Bold();
                                t.Span(r.Opis);
                            });
                        }
                    }

                    if (!string.IsNullOrEmpty(exam.Zakljucak))
                    {
                        col.Item().PaddingTop(10).Text("Zaključak").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Text(exam.Zakljucak);
                    }

                    if (!string.IsNullOrEmpty(exam.Preporuka))
                    {
                        col.Item().PaddingTop(10).Text("Preporuka").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Text(exam.Preporuka);
                    }

                    if (!string.IsNullOrEmpty(report.Sadrzaj))
                    {
                        col.Item().PaddingTop(10).Text("Dodatni sadržaj").Bold().FontSize(13);
                        col.Item().PaddingVertical(3).LineHorizontal(0.5f);
                        col.Item().Text(report.Sadrzaj);
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Dr ");
                    t.Span($"{doctor.User.Ime} {doctor.User.Prezime}").Bold();
                    if (report.Status == "potpisan")
                        t.Span(" (potpisan)");
                });
            });
        });

        var bytes = pdf.GeneratePdf();
        return File(bytes, "application/pdf", $"izvestaj-{report.MedicalReportId}.pdf");
    }
}
