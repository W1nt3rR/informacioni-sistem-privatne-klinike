using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Discounts;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DiscountsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DiscountResponse>>> GetAll()
    {
        var list = await db.Discounts
            .OrderBy(d => d.Naziv)
            .Select(d => new DiscountResponse(d.DiscountId, d.Naziv, d.Tip, d.Procenat, d.VaziOd, d.VaziDo, d.Aktivan))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiscountResponse>> GetById(int id)
    {
        var d = await db.Discounts.FindAsync(id);
        if (d == null) return NotFound();
        return Ok(new DiscountResponse(d.DiscountId, d.Naziv, d.Tip, d.Procenat, d.VaziOd, d.VaziDo, d.Aktivan));
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DiscountResponse>> Create(CreateDiscountRequest request)
    {
        var entity = new Discount
        {
            Naziv = request.Naziv,
            Tip = request.Tip,
            Procenat = request.Procenat,
            VaziOd = request.VaziOd,
            VaziDo = request.VaziDo,
            Aktivan = request.Aktivan,
        };
        db.Discounts.Add(entity);
        await db.SaveChangesAsync();
        var response = new DiscountResponse(entity.DiscountId, entity.Naziv, entity.Tip, entity.Procenat, entity.VaziOd, entity.VaziDo, entity.Aktivan);
        return CreatedAtAction(nameof(GetById), new { id = entity.DiscountId }, response);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateDiscountRequest request)
    {
        var entity = await db.Discounts.FindAsync(id);
        if (entity == null) return NotFound();
        entity.Naziv = request.Naziv;
        entity.Tip = request.Tip;
        entity.Procenat = request.Procenat;
        entity.VaziOd = request.VaziOd;
        entity.VaziDo = request.VaziDo;
        entity.Aktivan = request.Aktivan;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Discounts.FindAsync(id);
        if (entity == null) return NotFound();
        db.Discounts.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
