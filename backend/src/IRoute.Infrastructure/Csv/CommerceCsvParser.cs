using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using IRoute.Application.Abstractions;
using IRoute.Application.Dtos;
using IRoute.Application.Exceptions;
using IRoute.Domain.Entities;

namespace IRoute.Infrastructure.Csv;

/// <summary>
/// Parser del archivo <c>commerce_DDMMYYYY.csv</c> basado en CsvHelper.
/// Detecta el delimitador (<c>;</c> o <c>,</c>), valida la cabecera y
/// acumula errores de formato por línea sin abortar toda la carga.
/// </summary>
public sealed class CommerceCsvParser : ICommerceCsvParser
{
    /// <summary>Columnas obligatorias del archivo (en minúsculas).</summary>
    public static readonly string[] RequiredColumns =
    [
        "pc_codcom", "pc_nomcomred", "pc_tipodoc", "pc_numdoc",
        "pc_direccion", "pc_telefono", "pc_email", "pc_processdate"
    ];

    /// <summary>Formatos aceptados para pc_processdate.</summary>
    private static readonly string[] DateFormats =
        ["dd/MM/yyyy", "ddMMyyyy", "yyyy-MM-dd", "dd-MM-yyyy", "yyyyMMdd"];

    public async Task<CsvParseResult> ParseAsync(Stream content, CancellationToken ct = default)
    {
        using var reader = new StreamReader(content, detectEncodingFromByteOrderMarks: true, leaveOpen: true);

        // Leemos la cabecera para detectar el delimitador antes de instanciar CsvHelper.
        var headerLine = await reader.ReadLineAsync(ct);
        if (string.IsNullOrWhiteSpace(headerLine))
            throw new EmptyFileException();

        var delimiter = DetectDelimiter(headerLine);
        content.Seek(0, SeekOrigin.Begin);
        reader.DiscardBufferedData();

        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = delimiter,
            HasHeaderRecord = true,
            TrimOptions = TrimOptions.Trim,
            PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant(),
            MissingFieldFound = null,
            BadDataFound = null,
            IgnoreBlankLines = true,
        };

        using var csv = new CsvReader(reader, config);

        if (!await csv.ReadAsync() || !csv.ReadHeader())
            throw new EmptyFileException();

        ValidateHeader(csv.HeaderRecord ?? []);

        var records = new List<CommerceRecord>();
        var errors = new List<CsvRowError>();

        while (await csv.ReadAsync())
        {
            ct.ThrowIfCancellationRequested();
            var line = csv.Context.Parser!.Row;

            var rawDate = csv.GetField("pc_processdate");
            if (!TryParseDate(rawDate, out var processDate))
            {
                errors.Add(new CsvRowError(line, $"pc_processdate inválida: '{rawDate}'. Formato esperado dd/MM/yyyy."));
                continue;
            }

            records.Add(new CommerceRecord(
                CodCom: Clean(csv.GetField("pc_codcom")),
                NomComRed: Clean(csv.GetField("pc_nomcomred")),
                TipoDoc: Clean(csv.GetField("pc_tipodoc")),
                NumDoc: Clean(csv.GetField("pc_numdoc")),
                Direccion: Clean(csv.GetField("pc_direccion")),
                Telefono: Clean(csv.GetField("pc_telefono")),
                Email: Clean(csv.GetField("pc_email")),
                ProcessDate: processDate));
        }

        return new CsvParseResult(records, errors);
    }

    private static string DetectDelimiter(string headerLine)
        => headerLine.Count(c => c == ';') >= headerLine.Count(c => c == ',') ? ";" : ",";

    private static void ValidateHeader(IEnumerable<string> header)
    {
        var present = header.Select(h => h.Trim().ToLowerInvariant()).ToHashSet();
        var missing = RequiredColumns.Where(c => !present.Contains(c)).ToList();
        if (missing.Count > 0)
            throw new BadRequestException($"Faltan columnas en el archivo: {string.Join(", ", missing)}.");
    }

    private static bool TryParseDate(string? raw, out DateOnly date)
        => DateOnly.TryParseExact(raw?.Trim(), DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    /// <summary>Normaliza vacíos a <c>null</c> para que la validación en BD sea uniforme.</summary>
    private static string? Clean(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
