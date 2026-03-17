using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.WorkingHours;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/doctors/{doctorId}/working-hours")]
[Authorize]
public class WorkingHoursController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WorkingHoursResponse>>> GetByDoctor(int doctorId)
    {
        if (!await db.Doctors.AnyAsync(d => d.DoctorId == doctorId))
            return NotFound();

        var list = await db.WorkingHours
            .Where(w => w.DoctorId == doctorId)
            .OrderBy(w => w.DanUNedelji)
            .Select(w => new WorkingHoursResponse(
                w.WorkingHoursId, w.DanUNedelji,
                w.VremeOd.ToString("HH:mm"), w.VremeDo.ToString("HH:mm")))
            .ToListAsync();

        return Ok(list);
    }

    [HttpPut]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> SetWorkingHours(int doctorId, List<SetWorkingHoursRequest> request)
    {
        if (!await db.Doctors.AnyAsync(d => d.DoctorId == doctorId))
            return NotFound();

        var existing = await db.WorkingHours
            .Where(w => w.DoctorId == doctorId)
            .ToListAsync();

        db.WorkingHours.RemoveRange(existing);

        var newEntries = request.Select(r => new Models.WorkingHours
        {
            DoctorId = doctorId,
            DanUNedelji = r.DanUNedelji,
            VremeOd = TimeOnly.Parse(r.VremeOd),
            VremeDo = TimeOnly.Parse(r.VremeDo)
        });

        db.WorkingHours.AddRange(newEntries);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
