using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace IRoute.Api.Auth;

/// <summary>
/// Implementación mínima para el reto: un único usuario definido en configuración
/// (sección <c>Auth</c>). En producción se reemplazaría por un proveedor de identidad.
/// </summary>
public sealed class JwtTokenService(IConfiguration configuration, JwtOptions options) : ITokenService
{
    public bool ValidateCredentials(string username, string password)
    {
        var expectedUser = configuration["Auth:Username"] ?? string.Empty;
        var expectedPass = configuration["Auth:Password"] ?? string.Empty;

        // Comparación en tiempo constante para no filtrar información por timing.
        return FixedTimeEquals(username, expectedUser) && FixedTimeEquals(password, expectedPass);
    }

    public (string Token, DateTime ExpiresAtUtc) CreateToken(string username)
    {
        var expires = DateTime.UtcNow.AddMinutes(options.ExpirationMinutes);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
            ],
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    private static bool FixedTimeEquals(string a, string b)
        => CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
}
