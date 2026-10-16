using IRoute.Application.Dtos;
using IRoute.Domain.Entities;

namespace IRoute.Application.Services;

/// <summary>Casos de uso del módulo de comercios.</summary>
public interface ICommerceService
{
    Task<UploadResult> UploadAsync(Stream content, string fileName, long length, CancellationToken ct = default);
    Task<ProcessResult> ProcessAsync(DateOnly processDate, CancellationToken ct = default);
    Task<PagedResult<QuarantinedCommerce>> GetQuarantineAsync(DateOnly? processDate, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<ProcessDateSummary>> GetSummaryAsync(CancellationToken ct = default);
}
