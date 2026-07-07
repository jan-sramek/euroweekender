using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application.Services;

public sealed class WeekendFlightCrawlerBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<WeekendFlightCrawlerBackgroundService> logger)
    : PeriodicJobBackgroundService(scopeFactory, logger)
{
    protected override string ServiceName => nameof(WeekendFlightCrawlerBackgroundService);
    protected override TimeSpan Interval => TimeSpan.FromHours(1);
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(6);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<WeekendFlightCrawlJob>().RunAsync(cancellationToken);
}
