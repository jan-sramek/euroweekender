using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application.Services;

public sealed class LocationImportBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<LocationImportBackgroundService> logger)
    : PeriodicJobBackgroundService(scopeFactory, logger)
{
    protected override string ServiceName => nameof(LocationImportBackgroundService);
    protected override TimeSpan Interval => TimeSpan.FromHours(24);
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(6);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<LocationImportJob>().RunAsync(cancellationToken);
}
