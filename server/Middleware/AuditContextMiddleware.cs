using System.Security.Claims;
using PrivateClinic.API.Services;

namespace PrivateClinic.API.Middleware;

public class AuditContextMiddleware
{
    private readonly RequestDelegate _next;

    public AuditContextMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        auditService.SetContext(userId, ipAddress);
        await _next(context);
    }
}
