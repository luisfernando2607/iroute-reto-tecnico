namespace IRoute.Domain.Entities;

/// <summary>Resumen de registros por fecha de proceso.</summary>
public sealed record ProcessDateSummary(DateOnly ProcessDate, int PendingCount, int QuarantinedCount);
