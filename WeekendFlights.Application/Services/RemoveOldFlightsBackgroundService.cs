using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application.Services;

public sealed class RemoveOldFlightsBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<RemoveOldFlightsBackgroundService> logger)
    : PeriodicJobBackgroundService(scopeFactory, logger)
{
    protected override string ServiceName => nameof(RemoveOldFlightsBackgroundService);
    protected override TimeSpan Interval => TimeSpan.FromHours(6);
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(12);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<OldFlightsCleanupJob>().RunAsync(cancellationToken);
}
