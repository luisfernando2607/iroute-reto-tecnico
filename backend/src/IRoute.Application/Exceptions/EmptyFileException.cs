namespace IRoute.Application.Exceptions;

/// <summary>El archivo recibido no contiene datos.</summary>
public sealed class EmptyFileException()
    : BadRequestException("El archivo se encuentra vacío.");
