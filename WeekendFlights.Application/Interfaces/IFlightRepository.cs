using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface IFlightRepository
{
    Task UpsertFlightsAsync(List<Flight> flights);
}
