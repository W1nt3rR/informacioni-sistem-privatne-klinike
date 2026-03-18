using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Examinations;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/examinations/{examinationId}/referrals")]
[Authorize(Roles = "admin,lekar")]
public class ReferralsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ReferralResponse>>> GetAll(int examinationId)
    {
        var exists = await db.Examinations.AnyAsync(e => e.ExaminationId == examinationId);
        if (!exists) return NotFound("Pregled ne postoji.");

        var referrals = await db.Referrals
            .Where(r => r.ExaminationId == examinationId)
            .ToListAsync();

        return referrals.Select(r => new ReferralResponse(
            r.ReferralId, r.ExaminationId, r.Tip, r.Opis, r.Status)).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<ReferralResponse>> Create(int examinationId, [FromBody] CreateReferralRequest req)
    {
        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam is null) return NotFound("Pregled ne postoji.");
        if (exam.Status == "zavrsen")
            return BadRequest("Ne može se dodati uput završenom pregledu.");

        var referral = new Referral
        {
            ExaminationId = examinationId,
            Tip = req.Tip,
            Opis = req.Opis
        };

        db.Referrals.Add(referral);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { examinationId },
            new ReferralResponse(referral.ReferralId, referral.ExaminationId,
                referral.Tip, referral.Opis, referral.Status));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ReferralResponse>> Update(int examinationId, int id, [FromBody] UpdateReferralRequest req)
    {
        var referral = await db.Referrals.FirstOrDefaultAsync(r => r.ReferralId == id && r.ExaminationId == examinationId);
        if (referral is null) return NotFound();

        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam?.Status == "zavrsen")
            return BadRequest("Ne može se menjati uput završenog pregleda.");

        referral.Tip = req.Tip;
        referral.Opis = req.Opis;
        referral.Status = req.Status;

        await db.SaveChangesAsync();

        return new ReferralResponse(referral.ReferralId, referral.ExaminationId,
            referral.Tip, referral.Opis, referral.Status);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int examinationId, int id)
    {
        var referral = await db.Referrals.FirstOrDefaultAsync(r => r.ReferralId == id && r.ExaminationId == examinationId);
        if (referral is null) return NotFound();

        var exam = await db.Examinations.FindAsync(examinationId);
        if (exam?.Status == "zavrsen")
            return BadRequest("Ne može se brisati uput završenog pregleda.");

        db.Referrals.Remove(referral);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
