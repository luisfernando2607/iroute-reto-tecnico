using IRoute.Application.Dtos;
using IRoute.Domain.Entities;

namespace IRoute.Application.Abstractions;

/// <summary>
/// Acceso a datos de comercios. Toda operación se resuelve mediante
/// stored procedures (ver carpeta <c>database/</c>).
/// </summary>
public interface ICommerceRepository
{
    /// <summary>Inserta en bloque en <c>dbo.commerce</c> vía <c>sp_create_commerce</c>.</summary>
    Task<int> CreateAsync(IReadOnlyCollection<CommerceRecord> records, CancellationToken ct = default);

    /// <summary>Ejecuta <c>sp_process_commerce</c> y devuelve la cantidad enviada a cuarentena.</summary>
    Task<int> ProcessAsync(DateOnly processDate, CancellationToken ct = default);

    /// <summary>Lista paginada de <c>dbo.commerce_quarantine</c> vía <c>sp_get_commerce_quarantine</c>.</summary>
    Task<PagedResult<QuarantinedCommerce>> GetQuarantineAsync(DateOnly? processDate, int page, int pageSize, CancellationToken ct = default);

    /// <summary>Resumen por fecha de proceso vía <c>sp_get_commerce_summary</c>.</summary>
    Task<IReadOnlyList<ProcessDateSummary>> GetSummaryAsync(CancellationToken ct = default);
}
