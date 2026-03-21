namespace WeekendFlights.Application.Interfaces;

public interface ILocationImportService
{
    Task ImportLocationsAsync(string apiKey);
}