using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Users;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/activity-log")]
[Authorize(Roles = "admin")]
public class ActivityLogController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? akcija,
        [FromQuery] string? tabela,
        [FromQuery] string? userId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var q = db.ActivityLogs.Include(a => a.User).AsQueryable();

        if (!string.IsNullOrEmpty(akcija))
            q = q.Where(a => a.Akcija == akcija);
        if (!string.IsNullOrEmpty(tabela))
            q = q.Where(a => a.Tabela == tabela);
        if (!string.IsNullOrEmpty(userId))
            q = q.Where(a => a.UserId == userId);
        if (from.HasValue)
            q = q.Where(a => a.DatumVreme >= from.Value);
        if (to.HasValue)
            q = q.Where(a => a.DatumVreme <= to.Value);

        var logs = await q.OrderByDescending(a => a.DatumVreme).Take(500).ToListAsync();

        return Ok(logs.Select(a => new ActivityLogResponse(
            a.ActivityLogId, a.UserId, a.User.UserName ?? "—",
            a.Akcija, a.Tabela, a.EntitetId,
            a.StareVrednosti, a.NoveVrednosti,
            a.DatumVreme, a.IpAdresa)));
    }
}
