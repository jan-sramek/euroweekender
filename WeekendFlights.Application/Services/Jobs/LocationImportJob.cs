using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services.Jobs;

public class LocationImportJob(
    ILocationImportService locationImportService,
    IConfiguration configuration,
    ILogger<LocationImportJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var apiKey = configuration["KiwiApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogWarning("Kiwi API key not configured, skipping location import");
            return;
        }

        await locationImportService.ImportLocationsAsync(apiKey);
        logger.LogInformation("Location import completed successfully at: {Timestamp}", DateTime.UtcNow);
    }
}
