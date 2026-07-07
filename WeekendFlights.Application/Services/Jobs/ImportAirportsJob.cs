using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services.Jobs;

public class ImportAirportsJob(
    ILocationImportService locationImportService,
    IConfiguration configuration,
    ILogger<ImportAirportsJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var apiKey = configuration["KiwiApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogWarning("Kiwi API key not configured, skipping airport import");
            return;
        }

        logger.LogInformation("Airport import started at: {Timestamp}", DateTime.UtcNow);
        await locationImportService.ImportAirportsAsync(apiKey, cancellationToken);
        logger.LogInformation("Airport import completed successfully at: {Timestamp}", DateTime.UtcNow);
    }
}
