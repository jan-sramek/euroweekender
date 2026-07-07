using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WeekendFlights.Application;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Infrastructure.Kiwi;
using WeekendFlights.Infrastructure.Persistence;
using WeekendFlights.Infrastructure.Persistence.Repositories;
using LocationImportService = WeekendFlights.Application.Services.LocationImportService;

namespace WeekendFlights.Infrastructure;

public static class Startup
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        return services
            .AddApplication()
            .AddCrawlOptions(config)
            .AddServices(config)
            .AddPersistence(config);
    }

    public static IServiceCollection AddServices(this IServiceCollection services, IConfiguration config)
    {
        services
            .AddScoped<ILocationImportService, LocationImportService>()
            .AddScoped<ICityRepository, CityRepository>()
            .AddScoped<IFlightRepository, FlightRepository>()
            .AddScoped<ILocationRepository, LocationRepository>()
            .AddScoped<IFlightsImportRepository, FlightsImportRepository>();

        services.AddHttpClient<IKiwiApiClient, KiwiApiClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.tequila.kiwi.com");
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        services.AddHttpClient<ITequilaApiSearchClient, TequilaApiSearchClient>()
            .ConfigureHttpClient((sp, client) =>
            {
                sp.GetRequiredService<TequilaApiSearchClientConfigurator>().Configure(client);
            });

        services.AddSingleton<TequilaApiSearchClientConfigurator>();

        return services;
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        var cs = config["DbConnectionString"] ?? config.GetConnectionString("Postgres");
        return services.AddDbContext<WeekendFlightsDbContext>(options => options.UseNpgsql(cs));
    }
}
