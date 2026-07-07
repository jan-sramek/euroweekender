using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services.Jobs;

public class OldFlightsCleanupJob(
    IFlightRepository flightRepository,
    ILogger<OldFlightsCleanupJob> logger)
{
    public const int RetentionDays = 30;

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var cutoffDate = DateTime.UtcNow.AddDays(-RetentionDays);
        var deletedCount = await flightRepository.DeleteOldFlightsAsync(cutoffDate, cancellationToken);

        if (deletedCount > 0)
        {
            logger.LogInformation("Removed {DeletedCount} old flights older than {CutoffDate}",
                deletedCount, cutoffDate.Date);
        }
        else
        {
            logger.LogInformation("No old flights to remove (cutoff: {CutoffDate})", cutoffDate.Date);
        }
    }
}
