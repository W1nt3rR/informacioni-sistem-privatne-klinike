using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Examinations;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/examinations/{examinationId}/therapies")]
[Authorize]
public class TherapiesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TherapyResponse>>> GetAll(int examinationId)
    {
        var exists = await db.Examinations.AnyAsync(e => e.ExaminationId == examinationId);
        if (!exists) return NotFound("Pregled ne postoji.");

        var therapies = await db.Therapies
            .Where(t => t.ExaminationId == examinationId)
            .ToListAsync();

        return therapies.Select(t => new TherapyResponse(
            t.TherapyId, t.ExaminationId, t.NazivLeka, t.Doza,
            t.Ucestalost, t.Trajanje, t.Napomena)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<TherapyResponse>> Create(int examinationId, [FromBody] CreateTherapyRequest req)
    {
        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam is null) return NotFound("Pregled ne postoji.");
        if (exam.Status == "zavrsen")
            return BadRequest("Ne može se dodati terapija završenom pregledu.");

        var therapy = new Therapy
        {
            ExaminationId = examinationId,
            NazivLeka = req.NazivLeka,
            Doza = req.Doza,
            Ucestalost = req.Ucestalost,
            Trajanje = req.Trajanje,
            Napomena = req.Napomena
        };

        db.Therapies.Add(therapy);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { examinationId },
            new TherapyResponse(therapy.TherapyId, therapy.ExaminationId,
                therapy.NazivLeka, therapy.Doza, therapy.Ucestalost,
                therapy.Trajanje, therapy.Napomena));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TherapyResponse>> Update(int examinationId, int id, [FromBody] UpdateTherapyRequest req)
    {
        var therapy = await db.Therapies.FirstOrDefaultAsync(t => t.TherapyId == id && t.ExaminationId == examinationId);
        if (therapy is null) return NotFound();

        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam?.Status == "zavrsen")
            return BadRequest("Ne može se menjati terapija završenog pregleda.");

        therapy.NazivLeka = req.NazivLeka;
        therapy.Doza = req.Doza;
        therapy.Ucestalost = req.Ucestalost;
        therapy.Trajanje = req.Trajanje;
        therapy.Napomena = req.Napomena;

        await db.SaveChangesAsync();

        return new TherapyResponse(therapy.TherapyId, therapy.ExaminationId,
            therapy.NazivLeka, therapy.Doza, therapy.Ucestalost,
            therapy.Trajanje, therapy.Napomena);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int examinationId, int id)
    {
        var therapy = await db.Therapies.FirstOrDefaultAsync(t => t.TherapyId == id && t.ExaminationId == examinationId);
        if (therapy is null) return NotFound();

        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam?.Status == "zavrsen")
            return BadRequest("Ne može se brisati terapija završenog pregleda.");

        db.Therapies.Remove(therapy);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
