using IRoute.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace IRoute.Api.Middleware;

/// <summary>
/// Traduce excepciones a respuestas <see cref="ProblemDetails"/> (RFC 7807)
/// y evita filtrar detalles internos al cliente.
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, title, detail) = exception switch
        {
            BadRequestException e => (StatusCodes.Status400BadRequest, "Solicitud inválida", e.Message),
            OperationCanceledException => (StatusCodes.Status499ClientClosedRequest, "Solicitud cancelada", "El cliente canceló la solicitud."),
            SqlException e => (StatusCodes.Status503ServiceUnavailable, "Error de base de datos", LogAndHide(e)),
            _ => (StatusCodes.Status500InternalServerError, "Error interno", LogAndHide(exception))
        };

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        }, ct);

        return true;
    }

    private string LogAndHide(Exception e)
    {
        logger.LogError(e, "Error no controlado procesando la solicitud");
        return "Ocurrió un error procesando la solicitud. Intente nuevamente.";
    }
}
