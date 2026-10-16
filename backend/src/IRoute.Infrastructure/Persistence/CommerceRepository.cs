using System.Data;
using Dapper;
using IRoute.Application.Abstractions;
using IRoute.Application.Dtos;
using IRoute.Domain.Entities;

namespace IRoute.Infrastructure.Persistence;

/// <summary>
/// Implementación con Dapper. Cada método invoca exactamente un stored procedure;
/// la carga masiva viaja en un Table-Valued Parameter para evitar N round-trips.
/// </summary>
public sealed class CommerceRepository(SqlConnectionFactory factory) : ICommerceRepository
{
    private const string TvpTypeName = "dbo.CommerceTableType";

    public async Task<int> CreateAsync(IReadOnlyCollection<CommerceRecord> records, CancellationToken ct = default)
    {
        if (records.Count == 0) return 0;

        using var connection = await factory.OpenAsync(ct);
        var parameters = new DynamicParameters();
        parameters.Add("@rows", ToDataTable(records).AsTableValuedParameter(TvpTypeName));

        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            "dbo.sp_create_commerce", parameters, commandType: CommandType.StoredProcedure, cancellationToken: ct));
    }

    public async Task<int> ProcessAsync(DateOnly processDate, CancellationToken ct = default)
    {
        using var connection = await factory.OpenAsync(ct);
        return await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            "dbo.sp_process_commerce",
            new { processdate = processDate.ToDateTime(TimeOnly.MinValue) },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));
    }

    public async Task<PagedResult<QuarantinedCommerce>> GetQuarantineAsync(
        DateOnly? processDate, int page, int pageSize, CancellationToken ct = default)
    {
        using var connection = await factory.OpenAsync(ct);
        using var grid = await connection.QueryMultipleAsync(new CommandDefinition(
            "dbo.sp_get_commerce_quarantine",
            new
            {
                processdate = processDate?.ToDateTime(TimeOnly.MinValue),
                page,
                pagesize = pageSize
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: ct));

        var total = await grid.ReadSingleAsync<int>();
        var rows = await grid.ReadAsync<QuarantineRow>();

        return new PagedResult<QuarantinedCommerce>(rows.Select(r => r.ToEntity()).ToList(), total, page, pageSize);
    }

    public async Task<IReadOnlyList<ProcessDateSummary>> GetSummaryAsync(CancellationToken ct = default)
    {
        using var connection = await factory.OpenAsync(ct);
        var rows = await connection.QueryAsync<SummaryRow>(new CommandDefinition(
            "dbo.sp_get_commerce_summary", commandType: CommandType.StoredProcedure, cancellationToken: ct));

        return rows.Select(r => new ProcessDateSummary(
            DateOnly.FromDateTime(r.pc_processdate), r.pending_count, r.quarantined_count)).ToList();
    }

    /// <summary>Construye la tabla en memoria con el mismo orden de columnas que el TVP.</summary>
    private static DataTable ToDataTable(IEnumerable<CommerceRecord> records)
    {
        var table = new DataTable();
        table.Columns.Add("pc_codcom", typeof(string));
        table.Columns.Add("pc_nomcomred", typeof(string));
        table.Columns.Add("pc_tipodoc", typeof(string));
        table.Columns.Add("pc_numdoc", typeof(string));
        table.Columns.Add("pc_direccion", typeof(string));
        table.Columns.Add("pc_telefono", typeof(string));
        table.Columns.Add("pc_email", typeof(string));
        table.Columns.Add("pc_processdate", typeof(DateTime));

        foreach (var r in records)
        {
            table.Rows.Add(
                (object?)r.CodCom ?? DBNull.Value,
                (object?)r.NomComRed ?? DBNull.Value,
                (object?)r.TipoDoc ?? DBNull.Value,
                (object?)r.NumDoc ?? DBNull.Value,
                (object?)r.Direccion ?? DBNull.Value,
                (object?)r.Telefono ?? DBNull.Value,
                (object?)r.Email ?? DBNull.Value,
                r.ProcessDate.ToDateTime(TimeOnly.MinValue));
        }

        return table;
    }

    // Filas crudas tal como las devuelve SQL Server (snake_case), mapeadas luego a dominio.
#pragma warning disable IDE1006 // nombres snake_case para que Dapper mapee por nombre de columna
    private sealed class QuarantineRow
    {
        public long id { get; set; }
        public long commerce_id { get; set; }
        public string? pc_codcom { get; set; }
        public string? pc_nomcomred { get; set; }
        public string? pc_tipodoc { get; set; }
        public string? pc_numdoc { get; set; }
        public string? pc_direccion { get; set; }
        public string? pc_telefono { get; set; }
        public string? pc_email { get; set; }
        public DateTime pc_processdate { get; set; }
        public string motivo { get; set; } = string.Empty;
        public DateTime quarantined_at { get; set; }

        public QuarantinedCommerce ToEntity() => new()
        {
            Id = id,
            CommerceId = commerce_id,
            CodCom = pc_codcom,
            NomComRed = pc_nomcomred,
            TipoDoc = pc_tipodoc,
            NumDoc = pc_numdoc,
            Direccion = pc_direccion,
            Telefono = pc_telefono,
            Email = pc_email,
            ProcessDate = DateOnly.FromDateTime(pc_processdate),
            Motivo = motivo,
            QuarantinedAt = DateTime.SpecifyKind(quarantined_at, DateTimeKind.Utc)
        };
    }

    private sealed class SummaryRow
    {
        public DateTime pc_processdate { get; set; }
        public int pending_count { get; set; }
        public int quarantined_count { get; set; }
    }
#pragma warning restore IDE1006
}
