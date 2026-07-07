using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services;

public class LocationImportService(
    ILocationRepository repository,
    IKiwiApiClient kiwi) : ILocationImportService
{
    public async Task ImportCitiesAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var cities = await kiwi.LoadCitiesAsync(apiKey, cancellationToken);
        await repository.SaveCitiesAsync(cities);
    }

    public async Task ImportAirportsAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var airports = await kiwi.LoadAirportsAsync(apiKey, cancellationToken);
        await repository.SaveAirports(airports);
    }
}
