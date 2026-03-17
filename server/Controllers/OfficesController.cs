using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Offices;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OfficesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<OfficeResponse>>> GetAll()
    {
        var list = await db.Offices
            .OrderBy(o => o.Naziv)
            .Select(o => new OfficeResponse(o.OfficeId, o.Naziv, o.Lokacija, o.Oprema, o.Dostupna))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OfficeResponse>> GetById(int id)
    {
        var o = await db.Offices.FindAsync(id);
        if (o == null) return NotFound();
        return Ok(new OfficeResponse(o.OfficeId, o.Naziv, o.Lokacija, o.Oprema, o.Dostupna));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<OfficeResponse>> Create(CreateOfficeRequest request)
    {
        var entity = new Office { Naziv = request.Naziv, Lokacija = request.Lokacija, Oprema = request.Oprema, Dostupna = request.Dostupna };
        db.Offices.Add(entity);
        await db.SaveChangesAsync();
        var response = new OfficeResponse(entity.OfficeId, entity.Naziv, entity.Lokacija, entity.Oprema, entity.Dostupna);
        return CreatedAtAction(nameof(GetById), new { id = entity.OfficeId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateOfficeRequest request)
    {
        var entity = await db.Offices.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Naziv = request.Naziv;
        entity.Lokacija = request.Lokacija;
        entity.Oprema = request.Oprema;
        entity.Dostupna = request.Dostupna;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Offices.FindAsync(id);
        if (entity == null) return NotFound();
        db.Offices.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
