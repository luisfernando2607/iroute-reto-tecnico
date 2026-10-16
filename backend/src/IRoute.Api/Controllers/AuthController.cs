using IRoute.Api.Auth;
using IRoute.Api.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace IRoute.Api.Controllers;

/// <summary>Inicio de sesión (pantalla opcional del reto).</summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(ITokenService tokens) : ControllerBase
{
    /// <summary>Valida credenciales y devuelve un JWT.</summary>
    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
    {
        if (!tokens.ValidateCredentials(request.Username, request.Password))
            return Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Credenciales inválidas",
                detail: "Usuario o contraseña incorrectos.");

        var (token, expires) = tokens.CreateToken(request.Username);
        return Ok(new LoginResponse(token, expires, request.Username));
    }
}
