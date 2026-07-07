using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services.Jobs;

namespace WeekendFlights.Application.Services;

public sealed class WeekendFlightCrawlerBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<WeekendFlightCrawlerBackgroundService> logger)
    : PeriodicJobBackgroundService(scopeFactory, logger)
{
    protected override string ServiceName => nameof(WeekendFlightCrawlerBackgroundService);
    protected override TimeSpan Interval => TimeSpan.FromMinutes(crawlOptions.Value.IntervalMinutes);
    protected override TimeSpan ErrorBackoff => TimeSpan.FromHours(6);

    protected override Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken) =>
        services.GetRequiredService<WeekendFlightCrawlJob>().RunAsync(cancellationToken);
}
