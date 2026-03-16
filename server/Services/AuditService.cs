using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using PrivateClinic.API.Data;
using PrivateClinic.API.Models;

namespace PrivateClinic.API.Services;

public interface IAuditService
{
    void SetContext(string? userId, string? ipAddress);
    List<ActivityLog> GetPendingLogs(ChangeTracker changeTracker);
}

public class AuditService : IAuditService
{
    private string? _userId;
    private string? _ipAddress;

    public void SetContext(string? userId, string? ipAddress)
    {
        _userId = userId;
        _ipAddress = ipAddress;
    }

    public List<ActivityLog> GetPendingLogs(ChangeTracker changeTracker)
    {
        var logs = new List<ActivityLog>();
        changeTracker.DetectChanges();

        foreach (var entry in changeTracker.Entries())
        {
            if (entry.Entity is ActivityLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var tableName = entry.Metadata.GetTableName() ?? entry.Metadata.ClrType.Name;
            var action = entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Modified => "UPDATE",
                EntityState.Deleted => "DELETE",
                _ => null
            };

            if (action is null) continue;

            var primaryKey = entry.Properties
                .Where(p => p.Metadata.IsPrimaryKey())
                .Select(p => p.CurrentValue?.ToString())
                .FirstOrDefault();

            string? oldValues = null;
            string? newValues = null;

            if (entry.State == EntityState.Modified)
            {
                var changed = entry.Properties
                    .Where(p => p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue);
                oldValues = JsonSerializer.Serialize(changed);

                var current = entry.Properties
                    .Where(p => p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
                newValues = JsonSerializer.Serialize(current);
            }
            else if (entry.State == EntityState.Added)
            {
                var current = entry.Properties
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
                newValues = JsonSerializer.Serialize(current);
            }
            else if (entry.State == EntityState.Deleted)
            {
                var original = entry.Properties
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue);
                oldValues = JsonSerializer.Serialize(original);
            }

            logs.Add(new ActivityLog
            {
                UserId = _userId ?? "system",
                Akcija = action,
                Tabela = tableName,
                EntitetId = primaryKey,
                StareVrednosti = oldValues,
                NoveVrednosti = newValues,
                DatumVreme = DateTime.UtcNow,
                IpAdresa = _ipAddress
            });
        }

        return logs;
    }
}
