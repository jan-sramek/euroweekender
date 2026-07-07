using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ILocationRepository
{
    Task SaveCitiesAsync(List<City> cities);
    Task SaveAirport(Airport airport, string cityKiwiId);
    Task SaveAirports(List<Airport> airports);
}