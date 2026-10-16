namespace IRoute.Application.Exceptions;

/// <summary>Error de validación de entrada; el API lo traduce a HTTP 400.</summary>
public class BadRequestException(string message) : Exception(message);
