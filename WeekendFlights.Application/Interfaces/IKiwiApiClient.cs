using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface IKiwiApiClient
{
    Task<List<City>> LoadCitiesAsync(string apiKey, CancellationToken cancellationToken = default);
    Task<List<Airport>> LoadAirportsAsync(string apiKey, CancellationToken cancellationToken = default);
}
