using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface IKiwiApiClient
{
    Task<List<City>> LoadCitiesAsync(string apiKey, CancellationToken cancellationToken = default);
    Task<AirportImportData> LoadAirportsAsync(string apiKey, CancellationToken cancellationToken = default);
}
