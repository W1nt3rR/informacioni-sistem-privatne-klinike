using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Specializations;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SpecializationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SpecializationResponse>>> GetAll()
    {
        var list = await db.Specializations
            .OrderBy(s => s.Naziv)
            .Select(s => new SpecializationResponse(s.SpecializationId, s.Naziv, s.Opis))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SpecializationResponse>> GetById(int id)
    {
        var s = await db.Specializations.FindAsync(id);
        if (s == null) return NotFound();
        return Ok(new SpecializationResponse(s.SpecializationId, s.Naziv, s.Opis));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SpecializationResponse>> Create(CreateSpecializationRequest request)
    {
        var entity = new Specialization { Naziv = request.Naziv, Opis = request.Opis };
        db.Specializations.Add(entity);
        await db.SaveChangesAsync();
        var response = new SpecializationResponse(entity.SpecializationId, entity.Naziv, entity.Opis);
        return CreatedAtAction(nameof(GetById), new { id = entity.SpecializationId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateSpecializationRequest request)
    {
        var entity = await db.Specializations.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Naziv = request.Naziv;
        entity.Opis = request.Opis;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Specializations.FindAsync(id);
        if (entity == null) return NotFound();
        db.Specializations.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
