namespace IRoute.Api.Auth;

/// <summary>Configuración de emisión/validación de JWT (sección <c>Jwt</c> de appsettings).</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "iroute";
    public string Audience { get; init; } = "iroute-web";
    public string Key { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 60;
}
