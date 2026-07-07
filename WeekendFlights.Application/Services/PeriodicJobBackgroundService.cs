using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace WeekendFlights.Application.Services;

public abstract class PeriodicJobBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger logger) : BackgroundService
{
    protected abstract string ServiceName { get; }
    protected abstract TimeSpan Interval { get; }
    protected abstract TimeSpan ErrorBackoff { get; }

    protected abstract Task ExecuteJobAsync(IServiceProvider services, CancellationToken cancellationToken);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("{ServiceName} started.", ServiceName);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                await ExecuteJobAsync(scope.ServiceProvider, stoppingToken);
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                logger.LogInformation("{ServiceName} stopped by cancellation token.", ServiceName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in {ServiceName} loop", ServiceName);
                await Task.Delay(ErrorBackoff, stoppingToken);
            }
        }

        logger.LogInformation("{ServiceName} stopped.", ServiceName);
    }
}
