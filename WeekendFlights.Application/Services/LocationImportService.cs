using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services;

public class LocationImportService(
    ILocationRepository repository,
    IKiwiApiClient kiwi,
    ILogger<LocationImportService> logger) : ILocationImportService
{
    public async Task ImportCitiesAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        logger.LogInformation("Fetching cities from Kiwi...");
        var cities = await kiwi.LoadCitiesAsync(apiKey, cancellationToken);
        logger.LogInformation("Saving {CityCount} cities to database...", cities.Count);
        await repository.SaveCitiesAsync(cities);
        logger.LogInformation("Saved {CityCount} cities", cities.Count);
    }

    public async Task ImportAirportsAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        logger.LogInformation("Fetching airports from Kiwi...");
        var importData = await kiwi.LoadAirportsAsync(apiKey, cancellationToken);

        if (importData.SupplementalCities.Count > 0)
        {
            logger.LogInformation(
                "Saving {CityCount} supplemental cities referenced by airports...",
                importData.SupplementalCities.Count);
            await repository.SaveCitiesAsync(importData.SupplementalCities);
        }

        logger.LogInformation("Saving {AirportCount} airports to database...", importData.Airports.Count);
        await repository.SaveAirports(importData.Airports);
        logger.LogInformation("Saved {AirportCount} airports", importData.Airports.Count);
    }
}
