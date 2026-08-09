using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application.Services;

public sealed class DayTripFlightCrawlerBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<DayTripFlightCrawlerBackgroundService> logger)
    : PeriodicJobBackgroundService(scopeFactory, logger)
{
    protected override string ServiceName => nameof(DayTripFlightCrawlerBackgroundService);
    // Align with weekend crawler cadence so day-trip coverage builds quickly.
    protected override TimeSpan Interval => TimeSpan.FromMinutes(Math.Max(10, crawlOptions.Value.IntervalMinutes));
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(6);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<DayTripFlightCrawlJob>().RunAsync(cancellationToken);
}
