using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Diagnoses;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiagnosesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DiagnosisResponse>>> GetAll([FromQuery] string? search)
    {
        var query = db.Diagnoses.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(d =>
                d.Sifra.ToLower().Contains(term) ||
                d.Naziv.ToLower().Contains(term));
        }

        var list = await query
            .OrderBy(d => d.Sifra)
            .Select(d => new DiagnosisResponse(d.DiagnosisId, d.Sifra, d.Naziv, d.Opis))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiagnosisResponse>> GetById(int id)
    {
        var d = await db.Diagnoses.FindAsync(id);
        if (d == null) return NotFound();
        return Ok(new DiagnosisResponse(d.DiagnosisId, d.Sifra, d.Naziv, d.Opis));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DiagnosisResponse>> Create(CreateDiagnosisRequest request)
    {
        var entity = new Diagnosis { Sifra = request.Sifra, Naziv = request.Naziv, Opis = request.Opis };
        db.Diagnoses.Add(entity);
        await db.SaveChangesAsync();
        var response = new DiagnosisResponse(entity.DiagnosisId, entity.Sifra, entity.Naziv, entity.Opis);
        return CreatedAtAction(nameof(GetById), new { id = entity.DiagnosisId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateDiagnosisRequest request)
    {
        var entity = await db.Diagnoses.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Sifra = request.Sifra;
        entity.Naziv = request.Naziv;
        entity.Opis = request.Opis;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Diagnoses.FindAsync(id);
        if (entity == null) return NotFound();
        db.Diagnoses.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
