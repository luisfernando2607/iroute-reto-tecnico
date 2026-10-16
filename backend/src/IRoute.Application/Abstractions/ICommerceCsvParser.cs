using IRoute.Application.Dtos;

namespace IRoute.Application.Abstractions;

/// <summary>Convierte el contenido del CSV de comercios en registros de dominio.</summary>
public interface ICommerceCsvParser
{
    Task<CsvParseResult> ParseAsync(Stream content, CancellationToken ct = default);
}
