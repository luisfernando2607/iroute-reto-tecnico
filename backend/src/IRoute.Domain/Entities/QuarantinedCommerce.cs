namespace IRoute.Domain.Entities;

/// <summary>Registro de la tabla <c>dbo.commerce_quarantine</c>.</summary>
public sealed class QuarantinedCommerce
{
    public long Id { get; init; }
    public long CommerceId { get; init; }
    public string? CodCom { get; init; }
    public string? NomComRed { get; init; }
    public string? TipoDoc { get; init; }
    public string? NumDoc { get; init; }
    public string? Direccion { get; init; }
    public string? Telefono { get; init; }
    public string? Email { get; init; }
    public DateOnly ProcessDate { get; init; }
    public string Motivo { get; init; } = string.Empty;
    public DateTime QuarantinedAt { get; init; }
}
