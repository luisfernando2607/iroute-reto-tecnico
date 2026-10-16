using IRoute.Api.Contracts;
using IRoute.Application.Dtos;
using IRoute.Application.Exceptions;
using IRoute.Application.Services;
using IRoute.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IRoute.Api.Controllers;

/// <summary>Carga, procesamiento y consulta de comercios.</summary>
[ApiController]
[Authorize]
[Route("api/commerce")]
[Produces("application/json")]
public sealed class CommerceController(ICommerceService service) : ControllerBase
{
    /// <summary>
    /// Recibe el archivo <c>commerce_DDMMYYYY.csv</c> y registra sus filas en la tabla
    /// <c>commerce</c> mediante <c>sp_create_commerce</c>.
    /// </summary>
    /// <response code="200">Archivo cargado; devuelve filas insertadas y errores de formato.</response>
    /// <response code="400">Archivo vacío, nombre inválido o cabecera incompleta.</response>
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType<UploadResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UploadResult>> Upload(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new EmptyFileException();

        await using var stream = file.OpenReadStream();
        var result = await service.UploadAsync(stream, file.FileName, file.Length, ct);
        return Ok(result);
    }

    /// <summary>
    /// Procesa los registros de la fecha indicada: los que no cumplen las validaciones
    /// se mueven a <c>commerce_quarantine</c> con su motivo (<c>sp_process_commerce</c>).
    /// </summary>
    /// <response code="200">Cantidad de registros enviados a cuarentena.</response>
    [HttpPost("process")]
    [ProducesResponseType<ProcessResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProcessResult>> Process([FromBody] ProcessRequest request, CancellationToken ct)
        => Ok(await service.ProcessAsync(request.ProcessDate, ct));

    /// <summary>Lista los comercios en cuarentena con su motivo (paginado).</summary>
    /// <param name="processDate">Filtro opcional por fecha de proceso (yyyy-MM-dd).</param>
    /// <param name="page">Página (base 1).</param>
    /// <param name="pageSize">Tamaño de página (máx. 500).</param>
    /// <param name="ct">Token de cancelación.</param>
    [HttpGet("quarantine")]
    [ProducesResponseType<PagedResult<QuarantinedCommerce>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<QuarantinedCommerce>>> GetQuarantine(
        [FromQuery] DateOnly? processDate, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        => Ok(await service.GetQuarantineAsync(processDate, page, pageSize, ct));

    /// <summary>Resumen de registros pendientes y en cuarentena por fecha de proceso.</summary>
    [HttpGet("summary")]
    [ProducesResponseType<IReadOnlyList<ProcessDateSummary>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProcessDateSummary>>> GetSummary(CancellationToken ct)
        => Ok(await service.GetSummaryAsync(ct));
}
