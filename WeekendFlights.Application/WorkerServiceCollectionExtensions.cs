using Microsoft.Extensions.DependencyInjection;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application;

public static class WorkerServiceCollectionExtensions
{
    public static IServiceCollection AddWorkerJobs(this IServiceCollection services)
    {
        services.AddTransient<WeekendFlightCrawlJob>();
        services.AddTransient<FlightReturnTimesBackfillJob>();
        services.AddTransient<LocationImportJob>();
        services.AddTransient<OldFlightsCleanupJob>();
        return services;
    }
}
