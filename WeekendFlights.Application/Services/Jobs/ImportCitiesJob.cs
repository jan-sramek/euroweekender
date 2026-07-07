using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services.Jobs;

public class ImportCitiesJob(
    ILocationImportService locationImportService,
    IConfiguration configuration,
    ILogger<ImportCitiesJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var apiKey = configuration["KiwiApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogWarning("Kiwi API key not configured, skipping city import");
            return;
        }

        logger.LogInformation("City import started at: {Timestamp}", DateTime.UtcNow);
        await locationImportService.ImportCitiesAsync(apiKey, cancellationToken);
        logger.LogInformation("City import completed successfully at: {Timestamp}", DateTime.UtcNow);
    }
}
