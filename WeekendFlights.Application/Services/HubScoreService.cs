using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public sealed class HubScoreService(
    ICityRepository cityRepository,
    IFlightRepository flightRepository) : IHubScoreService
{
    public async Task<IReadOnlyList<OriginHubScore>> GetHubScoresAsync(
        int weeksAhead,
        CancellationToken cancellationToken = default)
    {
        weeksAhead = Math.Clamp(weeksAhead, 1, 12);
        var departFromUtc = DateTime.UtcNow;
        var departToUtc = departFromUtc.AddDays(weeksAhead * 7);

        var cities = await cityRepository.GetActiveCitiesAsync();
        var airportRanks = await cityRepository.GetBestAirportRankByCityCodeAsync(cancellationToken);
        var flightStats = await flightRepository.GetOriginHubStatsAsync(departFromUtc, departToUtc, cancellationToken);
        var flightByCode = flightStats.ToDictionary(s => s.CityCode, StringComparer.OrdinalIgnoreCase);

        return cities
            .Select(city =>
            {
                flightByCode.TryGetValue(city.Code, out var stats);
                airportRanks.TryGetValue(city.Code, out var airportRank);
                var hubScore = WeekendHubIndex.ResolveHubScore(stats, airportRank);

                return new OriginHubScore(
                    city.Code,
                    stats?.OfferCount ?? 0,
                    stats?.MinPrice ?? 0,
                    stats?.AverageQuality ?? 0,
                    stats?.DestinationCount ?? 0,
                    hubScore);
            })
            .Where(score => score.HubScore > 0)
            .OrderByDescending(score => score.HubScore)
            .ToList();
    }
}
