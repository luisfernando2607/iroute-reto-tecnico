namespace IRoute.Application.Dtos;

/// <summary>Respuesta del endpoint de procesamiento.</summary>
public sealed record ProcessResult(DateOnly ProcessDate, int QuarantinedCount);
