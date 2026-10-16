namespace IRoute.Application.Dtos;

/// <summary>Respuesta del endpoint de carga de archivo.</summary>
public sealed record UploadResult(
    string FileName,
    int TotalRows,
    int InsertedRows,
    IReadOnlyList<DateOnly> ProcessDates,
    IReadOnlyList<CsvRowError> Errors);
