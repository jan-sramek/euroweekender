using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ICityRepository
{
    Task<List<City>> GetAllCitiesAsync();
    Task<List<City>> GetActiveCitiesAsync();
    Task<List<City>> GetCitiesByCodesAsync(List<string> cityCodes);
    Task<City?> GetCityByCodeAsync(string code);
    Task<City?> GetCityByKiwiIdAsync(string kiwiId);
    Task<Dictionary<string, decimal>> GetBestAirportRankByCityCodeAsync(CancellationToken cancellationToken = default);
    Task AddCityAsync(City city);
    Task AddCitiesAsync(List<City> cities);
    Task UpdateCityAsync(City city);
    Task DeleteCityAsync(Guid cityId);
}
