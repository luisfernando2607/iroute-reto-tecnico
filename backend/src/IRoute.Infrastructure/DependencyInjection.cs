using IRoute.Application.Abstractions;
using IRoute.Application.Services;
using IRoute.Infrastructure.Csv;
using IRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IRoute.Infrastructure;

/// <summary>Registro de servicios de aplicación e infraestructura.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddIRouteServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("IRouteDb")
            ?? throw new InvalidOperationException("Falta ConnectionStrings:IRouteDb en la configuración.");

        services.AddSingleton(new SqlConnectionFactory(connectionString));
        services.AddScoped<ICommerceRepository, CommerceRepository>();
        services.AddSingleton<ICommerceCsvParser, CommerceCsvParser>();
        services.AddScoped<ICommerceService, CommerceService>();

        return services;
    }
}
