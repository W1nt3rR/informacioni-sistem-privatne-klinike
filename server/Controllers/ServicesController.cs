using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Services;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ServiceResponse>>> GetAll(
        [FromQuery] int? specializationId, [FromQuery] bool? aktivan)
    {
        var query = db.Services
            .Include(s => s.Specialization)
            .AsQueryable();

        if (specializationId.HasValue)
            query = query.Where(s => s.SpecializationId == specializationId.Value);
        if (aktivan.HasValue)
            query = query.Where(s => s.Aktivan == aktivan.Value);

        var list = await query
            .OrderBy(s => s.Naziv)
            .Select(s => new ServiceResponse(
                s.ServiceId, s.Naziv, s.Opis, s.TrajanjeMinuta, s.Cena,
                s.SpecializationId, s.Specialization.Naziv, s.Aktivan))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceResponse>> GetById(int id)
    {
        var s = await db.Services
            .Include(s => s.Specialization)
            .FirstOrDefaultAsync(s => s.ServiceId == id);

        if (s == null) return NotFound();

        return Ok(new ServiceResponse(
            s.ServiceId, s.Naziv, s.Opis, s.TrajanjeMinuta, s.Cena,
            s.SpecializationId, s.Specialization.Naziv, s.Aktivan));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ServiceResponse>> Create(CreateServiceRequest request)
    {
        var entity = new Service
        {
            Naziv = request.Naziv,
            Opis = request.Opis,
            TrajanjeMinuta = request.TrajanjeMinuta,
            Cena = request.Cena,
            SpecializationId = request.SpecializationId
        };

        db.Services.Add(entity);
        await db.SaveChangesAsync();

        await db.Entry(entity).Reference(e => e.Specialization).LoadAsync();
        var response = new ServiceResponse(
            entity.ServiceId, entity.Naziv, entity.Opis, entity.TrajanjeMinuta, entity.Cena,
            entity.SpecializationId, entity.Specialization.Naziv, entity.Aktivan);

        return CreatedAtAction(nameof(GetById), new { id = entity.ServiceId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateServiceRequest request)
    {
        var entity = await db.Services.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Naziv = request.Naziv;
        entity.Opis = request.Opis;
        entity.TrajanjeMinuta = request.TrajanjeMinuta;
        entity.Cena = request.Cena;
        entity.SpecializationId = request.SpecializationId;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var entity = await db.Services.FindAsync(id);
        if (entity == null) return NotFound();

        entity.Aktivan = !entity.Aktivan;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Services.FindAsync(id);
        if (entity == null) return NotFound();

        db.Services.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
