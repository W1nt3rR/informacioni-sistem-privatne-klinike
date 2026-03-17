using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.NonWorkingDays;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NonWorkingDaysController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<NonWorkingDayResponse>>> GetAll()
    {
        var list = await db.NonWorkingDays
            .OrderBy(n => n.Datum)
            .Select(n => new NonWorkingDayResponse(n.NonWorkingDayId, n.Datum, n.Naziv, n.Opis))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NonWorkingDayResponse>> GetById(int id)
    {
        var n = await db.NonWorkingDays.FindAsync(id);
        if (n == null) return NotFound();
        return Ok(new NonWorkingDayResponse(n.NonWorkingDayId, n.Datum, n.Naziv, n.Opis));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<NonWorkingDayResponse>> Create(CreateNonWorkingDayRequest request)
    {
        var entity = new NonWorkingDay { Datum = request.Datum, Naziv = request.Naziv, Opis = request.Opis };
        db.NonWorkingDays.Add(entity);
        await db.SaveChangesAsync();
        var response = new NonWorkingDayResponse(entity.NonWorkingDayId, entity.Datum, entity.Naziv, entity.Opis);
        return CreatedAtAction(nameof(GetById), new { id = entity.NonWorkingDayId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateNonWorkingDayRequest request)
    {
        var entity = await db.NonWorkingDays.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Datum = request.Datum;
        entity.Naziv = request.Naziv;
        entity.Opis = request.Opis;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.NonWorkingDays.FindAsync(id);
        if (entity == null) return NotFound();
        db.NonWorkingDays.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
