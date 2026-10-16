namespace IRoute.Api.Auth;

/// <summary>Valida credenciales y emite tokens de acceso.</summary>
public interface ITokenService
{
    bool ValidateCredentials(string username, string password);
    (string Token, DateTime ExpiresAtUtc) CreateToken(string username);
}
