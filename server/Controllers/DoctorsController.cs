using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Doctors;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController(AppDbContext db, UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<DoctorListResponse>>> GetAll([FromQuery] int? specializationId, [FromQuery] bool? aktivan)
    {
        var query = db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .AsQueryable();

        if (specializationId.HasValue)
            query = query.Where(d => d.SpecializationId == specializationId.Value);
        if (aktivan.HasValue)
            query = query.Where(d => d.Aktivan == aktivan.Value);

        var list = await query
            .OrderBy(d => d.User.Prezime).ThenBy(d => d.User.Ime)
            .Select(d => new DoctorListResponse(
                d.DoctorId, d.UserId, d.User.Ime, d.User.Prezime,
                d.User.Email!, d.User.PhoneNumber,
                d.Titula, d.LicencaBroj, d.Aktivan,
                d.SpecializationId, d.Specialization.Naziv))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorDetailResponse>> GetById(int id)
    {
        var d = await db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.DoctorServices).ThenInclude(ds => ds.Service)
            .Include(d => d.WorkingHours)
            .FirstOrDefaultAsync(d => d.DoctorId == id);

        if (d == null) return NotFound();

        var response = new DoctorDetailResponse(
            d.DoctorId, d.UserId, d.User.Ime, d.User.Prezime,
            d.User.Email!, d.User.PhoneNumber,
            d.Titula, d.LicencaBroj, d.Aktivan,
            d.SpecializationId, d.Specialization.Naziv,
            d.DoctorServices.Select(ds => new DoctorServiceResponse(
                ds.ServiceId, ds.Service.Naziv, ds.Service.TrajanjeMinuta, ds.Service.Cena)).ToList(),
            d.WorkingHours.OrderBy(w => w.DanUNedelji)
                .Select(w => new WorkingHoursResponse(
                    w.WorkingHoursId, w.DanUNedelji,
                    w.VremeOd.ToString("HH:mm"), w.VremeDo.ToString("HH:mm"))).ToList());

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DoctorDetailResponse>> Create(CreateDoctorRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.UserName,
            Email = request.Email,
            PhoneNumber = request.Telefon,
            Ime = request.Ime,
            Prezime = request.Prezime
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await userManager.AddToRoleAsync(user, "lekar");

        var doctor = new Doctor
        {
            UserId = user.Id,
            SpecializationId = request.SpecializationId,
            Titula = request.Titula,
            LicencaBroj = request.LicencaBroj
        };

        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = doctor.DoctorId },
            await GetDoctorDetail(doctor.DoctorId));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Update(int id, UpdateDoctorRequest request)
    {
        var doctor = await db.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.DoctorId == id);
        if (doctor == null) return NotFound();

        doctor.User.Ime = request.Ime;
        doctor.User.Prezime = request.Prezime;
        doctor.User.Email = request.Email;
        doctor.User.PhoneNumber = request.Telefon;
        doctor.SpecializationId = request.SpecializationId;
        doctor.Titula = request.Titula;
        doctor.LicencaBroj = request.LicencaBroj;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var doctor = await db.Doctors.Include(d => d.User).FirstOrDefaultAsync(d => d.DoctorId == id);
        if (doctor == null) return NotFound();

        doctor.Aktivan = !doctor.Aktivan;
        doctor.User.Aktivan = doctor.Aktivan;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/services/{serviceId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> AssignService(int id, int serviceId)
    {
        if (!await db.Doctors.AnyAsync(d => d.DoctorId == id))
            return NotFound();
        if (!await db.Services.AnyAsync(s => s.ServiceId == serviceId))
            return NotFound();
        if (await db.DoctorServices.AnyAsync(ds => ds.DoctorId == id && ds.ServiceId == serviceId))
            return Conflict("Usluga je već dodeljena ovom lekaru.");

        db.DoctorServices.Add(new DoctorService { DoctorId = id, ServiceId = serviceId });
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}/services/{serviceId}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> RemoveService(int id, int serviceId)
    {
        var ds = await db.DoctorServices
            .FirstOrDefaultAsync(ds => ds.DoctorId == id && ds.ServiceId == serviceId);
        if (ds == null) return NotFound();

        db.DoctorServices.Remove(ds);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<DoctorDetailResponse> GetDoctorDetail(int doctorId)
    {
        var d = await db.Doctors
            .Include(d => d.User)
            .Include(d => d.Specialization)
            .Include(d => d.DoctorServices).ThenInclude(ds => ds.Service)
            .Include(d => d.WorkingHours)
            .FirstAsync(d => d.DoctorId == doctorId);

        return new DoctorDetailResponse(
            d.DoctorId, d.UserId, d.User.Ime, d.User.Prezime,
            d.User.Email!, d.User.PhoneNumber,
            d.Titula, d.LicencaBroj, d.Aktivan,
            d.SpecializationId, d.Specialization.Naziv,
            d.DoctorServices.Select(ds => new DoctorServiceResponse(
                ds.ServiceId, ds.Service.Naziv, ds.Service.TrajanjeMinuta, ds.Service.Cena)).ToList(),
            d.WorkingHours.OrderBy(w => w.DanUNedelji)
                .Select(w => new WorkingHoursResponse(
                    w.WorkingHoursId, w.DanUNedelji,
                    w.VremeOd.ToString("HH:mm"), w.VremeDo.ToString("HH:mm"))).ToList());
    }
}
