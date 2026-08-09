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
    // Offset from weekend crawler so they don't hammer Kiwi at the same time.
    protected override TimeSpan Interval => TimeSpan.FromMinutes(Math.Max(15, crawlOptions.Value.IntervalMinutes + 5));
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(6);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<DayTripFlightCrawlJob>().RunAsync(cancellationToken);
}
