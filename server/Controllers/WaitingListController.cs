using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.WaitingList;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/waiting-list")]
[Authorize]
public class WaitingListController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WaitingListItemResponse>>> GetAll(
        [FromQuery] string? status)
    {
        var query = db.WaitingListItems
            .Include(w => w.Patient)
            .Include(w => w.Service)
            .Include(w => w.Doctor)!.ThenInclude(d => d!.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(w => w.Status == status);

        var items = await query
            .OrderBy(w => w.Prioritet)
            .ThenBy(w => w.DatumUpisa)
            .Select(w => new WaitingListItemResponse(
                w.WaitingListItemId,
                w.PatientId,
                $"{w.Patient.Ime} {w.Patient.Prezime}",
                w.ServiceId,
                w.Service.Naziv,
                w.DoctorId,
                w.Doctor != null ? $"{w.Doctor.User.Ime} {w.Doctor.User.Prezime}" : null,
                w.DatumUpisa,
                w.Prioritet,
                w.Status,
                w.Napomena))
            .ToListAsync();

        return items;
    }

    [HttpPost]
    public async Task<ActionResult<WaitingListItemResponse>> Create(
        [FromBody] CreateWaitingListItemRequest req)
    {
        var item = new WaitingListItem
        {
            PatientId = req.PatientId,
            ServiceId = req.ServiceId,
            DoctorId = req.DoctorId,
            Prioritet = req.Prioritet,
            Napomena = req.Napomena
        };

        db.WaitingListItems.Add(item);
        await db.SaveChangesAsync();

        // Reload with navigations
        var created = await db.WaitingListItems
            .Include(w => w.Patient)
            .Include(w => w.Service)
            .Include(w => w.Doctor)!.ThenInclude(d => d!.User)
            .Where(w => w.WaitingListItemId == item.WaitingListItemId)
            .Select(w => new WaitingListItemResponse(
                w.WaitingListItemId,
                w.PatientId,
                $"{w.Patient.Ime} {w.Patient.Prezime}",
                w.ServiceId,
                w.Service.Naziv,
                w.DoctorId,
                w.Doctor != null ? $"{w.Doctor.User.Ime} {w.Doctor.User.Prezime}" : null,
                w.DatumUpisa,
                w.Prioritet,
                w.Status,
                w.Napomena))
            .FirstAsync();

        return Created($"api/waiting-list/{item.WaitingListItemId}", created);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id,
        [FromBody] UpdateWaitingListStatusRequest req)
    {
        var item = await db.WaitingListItems.FindAsync(id);
        if (item is null) return NotFound();

        string[] validStatuses = ["aktivan", "zakazan", "istekao"];
        if (!validStatuses.Contains(req.Status))
            return BadRequest(new { message = $"Nepoznat status: {req.Status}" });

        item.Status = req.Status;
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.WaitingListItems.FindAsync(id);
        if (item is null) return NotFound();

        db.WaitingListItems.Remove(item);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
