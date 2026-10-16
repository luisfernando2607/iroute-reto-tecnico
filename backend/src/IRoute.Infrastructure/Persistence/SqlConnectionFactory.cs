using System.Data;
using Microsoft.Data.SqlClient;

namespace IRoute.Infrastructure.Persistence;

/// <summary>Crea conexiones abiertas a SQL Server a partir de la cadena configurada.</summary>
public sealed class SqlConnectionFactory(string connectionString)
{
    public async Task<IDbConnection> OpenAsync(CancellationToken ct = default)
    {
        var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        return connection;
    }
}
