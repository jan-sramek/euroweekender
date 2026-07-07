using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface IFlightRepository
{
    Task UpsertFlightsAsync(List<Flight> flights);
    Task<int> DeleteOldFlightsAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Flight> Flights, int TotalCount)> GetFlightsAsync(
        string? cityCodeFrom,
        string? cityCodeTo,
        DateTime? departFromUtc,
        DateTime? departToUtc,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OriginHubStats>> GetOriginHubStatsAsync(
        DateTime departFromUtc,
        DateTime departToUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetOriginCityCodesMissingReturnTimesAsync(
        CancellationToken cancellationToken = default);
}
