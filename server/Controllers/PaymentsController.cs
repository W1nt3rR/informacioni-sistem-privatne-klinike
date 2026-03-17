using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrivateClinic.API.Data;
using PrivateClinic.API.DTOs.Invoices;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Controllers;

[ApiController]
[Route("api/invoices/{invoiceId:int}/payments")]
[Authorize(Roles = "admin,recepcija,menadzer")]
public class PaymentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PaymentResponse>>> GetByInvoice(int invoiceId)
    {
        var exists = await db.Invoices.AnyAsync(i => i.InvoiceId == invoiceId);
        if (!exists) return NotFound("Invoice not found");

        var payments = await db.Payments
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.DatumPlacanja)
            .Select(p => new PaymentResponse(
                p.PaymentId, p.Iznos, p.NacinPlacanja,
                p.DatumPlacanja, p.Napomena))
            .ToListAsync();

        return Ok(payments);
    }

    [HttpPost]
    public async Task<ActionResult<PaymentResponse>> Create(int invoiceId, CreatePaymentRequest req)
    {
        var invoice = await db.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice is null) return NotFound("Invoice not found");
        if (invoice.StatusNaplate == "placeno")
            return BadRequest("Invoice is already fully paid");

        var totalPaid = invoice.Payments.Sum(p => p.Iznos) + req.Iznos;
        if (totalPaid > invoice.IznosZaNaplatu)
            return BadRequest("Iznos premašuje dugovanje.");

        var payment = new Payment
        {
            InvoiceId = invoiceId,
            Iznos = req.Iznos,
            NacinPlacanja = req.NacinPlacanja,
            Napomena = req.Napomena,
            DatumPlacanja = DateTime.UtcNow
        };

        db.Payments.Add(payment);

        totalPaid = invoice.Payments.Sum(p => p.Iznos) + req.Iznos;
        if (totalPaid >= invoice.IznosZaNaplatu)
            invoice.StatusNaplate = "placeno";
        else
            invoice.StatusNaplate = "delimicno";

        await db.SaveChangesAsync();

        return Ok(new PaymentResponse(
            payment.PaymentId, payment.Iznos, payment.NacinPlacanja,
            payment.DatumPlacanja, payment.Napomena));
    }
}
