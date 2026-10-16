using IRoute.Domain.Entities;

namespace IRoute.Application.Dtos;

/// <summary>Resultado del parseo del CSV: filas válidas y errores de formato por línea.</summary>
public sealed record CsvParseResult(
    IReadOnlyList<CommerceRecord> Records,
    IReadOnlyList<CsvRowError> Errors);

/// <summary>Error de formato detectado en una línea del CSV (no se inserta en BD).</summary>
public sealed record CsvRowError(int Line, string Message);
