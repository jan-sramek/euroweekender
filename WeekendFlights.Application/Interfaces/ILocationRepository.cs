using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ILocationRepository
{
    Task SaveCitiesAsync(List<City> cities);
}