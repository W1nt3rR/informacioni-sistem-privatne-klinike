using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Users;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "admin")]
public class UsersController(UserManager<ApplicationUser> userManager, AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? role)
    {
        var users = await userManager.Users.OrderBy(u => u.Prezime).ThenBy(u => u.Ime).ToListAsync();

        var result = new List<UserListResponse>();
        foreach (var u in users)
        {
            var roles = await userManager.GetRolesAsync(u);
            if (!string.IsNullOrEmpty(role) && !roles.Contains(role)) continue;

            result.Add(new UserListResponse(
                u.Id, u.UserName!, u.Ime, u.Prezime, u.Email, u.PhoneNumber,
                u.Aktivan, u.DatumKreiranja, roles));
        }
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        var roles = await userManager.GetRolesAsync(user);
        var doctor = await db.Doctors.FirstOrDefaultAsync(d => d.UserId == id);

        return Ok(new UserDetailResponse(
            user.Id, user.UserName!, user.Ime, user.Prezime, user.Email, user.PhoneNumber,
            user.Aktivan, user.DatumKreiranja, roles, doctor?.DoctorId));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest req)
    {
        var user = new ApplicationUser
        {
            UserName = req.UserName,
            Ime = req.Ime,
            Prezime = req.Prezime,
            Email = req.Email,
            PhoneNumber = req.PhoneNumber,
        };

        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await userManager.AddToRoleAsync(user, req.Role);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new { user.Id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, UpdateUserRequest req)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        user.Ime = req.Ime;
        user.Prezime = req.Prezime;
        user.Email = req.Email;
        user.PhoneNumber = req.PhoneNumber;

        await userManager.UpdateAsync(user);

        var currentRoles = await userManager.GetRolesAsync(user);
        await userManager.RemoveFromRolesAsync(user, currentRoles);
        await userManager.AddToRoleAsync(user, req.Role);

        return NoContent();
    }

    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> ToggleActive(string id)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user == null) return NotFound();

        user.Aktivan = !user.Aktivan;
        await userManager.UpdateAsync(user);

        return NoContent();
    }
}
