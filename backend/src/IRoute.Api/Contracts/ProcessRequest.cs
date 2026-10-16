using System.ComponentModel.DataAnnotations;

namespace IRoute.Api.Contracts;

/// <summary>Fecha de proceso (columna pc_processdate) a validar.</summary>
public sealed record ProcessRequest([Required] DateOnly ProcessDate);
