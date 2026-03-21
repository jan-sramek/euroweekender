using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        // MapsterSettings.Configure();
        return services
            .AddServices()
            .AddPersistence(config);
    }

    public static IServiceCollection AddServices(this IServiceCollection services)
    {
         services
            .AddScoped<ILocationImportService, LocationImportService>()
            .AddScoped<IKiwiApiClient, KiwiApiClient>()
            .AddScoped<ILocationImportService, LocationImportService>()
        
            // Repositories
            .AddScoped<ICityRepository, CityRepository>()
            . AddScoped<IFlightRepository, FlightRepository>()
            .AddScoped<ILocationRepository, LocationRepository>();

        // HTTP Client for Kiwi API
        services.AddHttpClient<ITequilaApiSearchClient, TequilaApiSearchSearchClient>(client =>
        {
            client.BaseAddress = new Uri("https://api.tequila.kiwi.com");
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
    
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        var cs = config["DbConnectionString"];
        return services.AddDbContext<WeekendFlightsDbContext>(options => options.UseNpgsql(cs));
    }
}