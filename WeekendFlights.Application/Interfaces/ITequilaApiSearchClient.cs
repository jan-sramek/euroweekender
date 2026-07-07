using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ITequilaApiSearchClient
{
    Task<IReadOnlyList<Flight>> SearchFlightsAsync(
        FlightSearchParameters parameters,
        CancellationToken cancellationToken = default);
}
