namespace IRoute.Domain.Entities;

/// <summary>
/// Fila del archivo <c>commerce_DDMMYYYY.csv</c>. Las propiedades mapean 1:1 con
/// las columnas del CSV y de la tabla <c>dbo.commerce</c>.
/// </summary>
public sealed record CommerceRecord(
    string? CodCom,
    string? NomComRed,
    string? TipoDoc,
    string? NumDoc,
    string? Direccion,
    string? Telefono,
    string? Email,
    DateOnly ProcessDate);
