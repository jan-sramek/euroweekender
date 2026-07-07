namespace WeekendFlights.Application.Interfaces;

public interface ILocationImportService
{
    Task ImportCitiesAsync(string apiKey, CancellationToken cancellationToken = default);
    Task ImportAirportsAsync(string apiKey, CancellationToken cancellationToken = default);
}
