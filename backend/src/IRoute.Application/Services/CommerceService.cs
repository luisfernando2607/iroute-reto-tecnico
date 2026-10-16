using IRoute.Application.Abstractions;
using IRoute.Application.Dtos;
using IRoute.Application.Exceptions;
using IRoute.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace IRoute.Application.Services;

/// <inheritdoc />
public sealed class CommerceService(
    ICommerceRepository repository,
    ICommerceCsvParser parser,
    ILogger<CommerceService> logger) : ICommerceService
{
    /// <summary>Nombre esperado: commerce_DDMMYYYY.csv</summary>
    private const string FilePrefix = "commerce_";
    private const string FileExtension = ".csv";

    public async Task<UploadResult> UploadAsync(Stream content, string fileName, long length, CancellationToken ct = default)
    {
        if (length == 0)
            throw new EmptyFileException();

        ValidateFileName(fileName);

        var parsed = await parser.ParseAsync(content, ct);

        if (parsed.Records.Count == 0 && parsed.Errors.Count == 0)
            throw new EmptyFileException();

        if (parsed.Records.Count == 0)
            throw new BadRequestException(
                $"El archivo no contiene filas válidas. Primer error: línea {parsed.Errors[0].Line}: {parsed.Errors[0].Message}");

        var inserted = await repository.CreateAsync(parsed.Records, ct);

        logger.LogInformation("Archivo {File}: {Inserted}/{Total} filas insertadas, {Errors} con error de formato",
            fileName, inserted, parsed.Records.Count + parsed.Errors.Count, parsed.Errors.Count);

        var dates = parsed.Records.Select(r => r.ProcessDate).Distinct().OrderByDescending(d => d).ToList();

        return new UploadResult(fileName, parsed.Records.Count + parsed.Errors.Count, inserted, dates, parsed.Errors);
    }

    public async Task<ProcessResult> ProcessAsync(DateOnly processDate, CancellationToken ct = default)
    {
        var quarantined = await repository.ProcessAsync(processDate, ct);
        logger.LogInformation("Proceso {Date}: {Count} registros enviados a cuarentena", processDate, quarantined);
        return new ProcessResult(processDate, quarantined);
    }

    public Task<PagedResult<QuarantinedCommerce>> GetQuarantineAsync(DateOnly? processDate, int page, int pageSize, CancellationToken ct = default)
        => repository.GetQuarantineAsync(processDate, Math.Max(page, 1), Math.Clamp(pageSize, 1, 500), ct);

    public Task<IReadOnlyList<ProcessDateSummary>> GetSummaryAsync(CancellationToken ct = default)
        => repository.GetSummaryAsync(ct);

    private static void ValidateFileName(string fileName)
    {
        var name = Path.GetFileName(fileName);
        if (!name.StartsWith(FilePrefix, StringComparison.OrdinalIgnoreCase)
            || !name.EndsWith(FileExtension, StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("El archivo debe llamarse commerce_DDMMYYYY.csv.");
        }
    }
}
