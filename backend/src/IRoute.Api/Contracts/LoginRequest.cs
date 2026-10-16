using System.ComponentModel.DataAnnotations;

namespace IRoute.Api.Contracts;

/// <summary>Credenciales de inicio de sesión.</summary>
public sealed record LoginRequest([Required] string Username, [Required] string Password);

/// <summary>Token emitido tras un login exitoso.</summary>
public sealed record LoginResponse(string Token, DateTime ExpiresAtUtc, string Username);
