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
            .OrderBy(d => d.JeSistemski ? 0 : 1).ThenBy(d => d.Naziv)
            .Select(d => new DiscountResponse(d.DiscountId, d.Naziv, d.Tip, d.Procenat, d.VaziOd, d.VaziDo, d.Aktivan, d.JeSistemski, d.Kod))
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DiscountResponse>> GetById(int id)
    {
        var d = await db.Discounts.FindAsync(id);
        if (d == null) return NotFound();
        return Ok(new DiscountResponse(d.DiscountId, d.Naziv, d.Tip, d.Procenat, d.VaziOd, d.VaziDo, d.Aktivan, d.JeSistemski, d.Kod));
    }

    /// <summary>Creates a discount code (tip=kod). System discounts are seeded, not created via API.</summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DiscountResponse>> Create(CreateDiscountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Kod))
            return BadRequest("Kod popusta je obavezan.");

        var codeUpper = request.Kod.Trim().ToUpperInvariant();
        if (await db.Discounts.AnyAsync(d => d.Kod == codeUpper))
            return BadRequest("Kod popusta već postoji.");

        var entity = new Discount
        {
            Naziv = request.Naziv,
            Tip = "kod",
            Procenat = request.Procenat,
            VaziOd = request.VaziOd,
            VaziDo = request.VaziDo,
            Aktivan = request.Aktivan,
            JeSistemski = false,
            Kod = codeUpper,
        };
        db.Discounts.Add(entity);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.DiscountId },
            new DiscountResponse(entity.DiscountId, entity.Naziv, entity.Tip, entity.Procenat, entity.VaziOd, entity.VaziDo, entity.Aktivan, entity.JeSistemski, entity.Kod));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateDiscountRequest request)
    {
        var entity = await db.Discounts.FindAsync(id);
        if (entity == null) return NotFound();

        // System discounts: only allow changing Procenat and Aktivan (not Naziv)
        if (!entity.JeSistemski)
        {
            entity.Naziv = request.Naziv;
            entity.VaziOd = request.VaziOd;
            entity.VaziDo = request.VaziDo;
        }

        entity.Procenat = request.Procenat;
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
        if (entity.JeSistemski)
            return BadRequest("Sistemski popusti se ne mogu obrisati.");
        db.Discounts.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Validates a discount code and returns its details if valid.</summary>
    [HttpPost("validate-code")]
    public async Task<ActionResult<ValidateCodeResponse>> ValidateCode(ValidateCodeRequest request)
    {
        var codeUpper = request.Kod?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(codeUpper))
            return Ok(new ValidateCodeResponse(false, null, null, null));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var discount = await db.Discounts.FirstOrDefaultAsync(d =>
            d.Kod == codeUpper &&
            d.Tip == "kod" &&
            d.Aktivan &&
            (d.VaziOd == null || d.VaziOd <= today) &&
            (d.VaziDo == null || d.VaziDo >= today));

        if (discount == null)
            return Ok(new ValidateCodeResponse(false, null, null, null));

        return Ok(new ValidateCodeResponse(true, discount.DiscountId, discount.Naziv, discount.Procenat));
    }
}
