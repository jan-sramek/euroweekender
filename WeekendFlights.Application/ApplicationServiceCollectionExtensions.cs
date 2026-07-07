using Microsoft.Extensions.DependencyInjection;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IHubScoreService, HubScoreService>();
        return services;
    }

    public static IServiceCollection AddCrawlOptions(
        this IServiceCollection services,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        services.Configure<CrawlOptions>(configuration.GetSection(CrawlOptions.SectionName));
        return services;
    }
}
