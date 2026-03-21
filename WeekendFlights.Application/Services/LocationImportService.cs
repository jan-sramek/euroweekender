using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Application.Services;

public class LocationImportService(
    ILocationRepository repository,
    IKiwiApiClient kiwi) : ILocationImportService
{
    public async Task ImportLocationsAsync(string apiKey)
    {
        var cities = await kiwi.LoadCitiesAsync(apiKey);
        await repository.SaveCitiesAsync(cities);
        
        //TODO: Airports
    }
}