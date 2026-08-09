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

        // Avoid loading full City rows (jsonb locale maps, etc.) — ranks + flight stats are enough.
        var airportRanks = await cityRepository.GetBestAirportRankByCityCodeAsync(cancellationToken);
        var flightStats = await flightRepository.GetOriginHubStatsAsync(departFromUtc, departToUtc, cancellationToken);
        var flightByCode = flightStats.ToDictionary(s => s.CityCode, StringComparer.OrdinalIgnoreCase);

        var codes = airportRanks.Keys
            .Concat(flightByCode.Keys)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        return codes
            .Select(code =>
            {
                flightByCode.TryGetValue(code, out var stats);
                airportRanks.TryGetValue(code, out var airportRank);
                var hubScore = WeekendHubIndex.ResolveHubScore(stats, airportRank);

                return new OriginHubScore(
                    code,
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

    public async Task<IReadOnlyList<OriginDestinationStats>> GetTopDestinationsAsync(
        string cityCodeFrom,
        int weeksAhead,
        int limit,
        CancellationToken cancellationToken = default)
    {
        weeksAhead = Math.Clamp(weeksAhead, 1, 12);
        limit = Math.Clamp(limit, 1, 50);
        var code = cityCodeFrom.Trim().ToUpperInvariant();
        if (code.Length == 0)
            return Array.Empty<OriginDestinationStats>();

        var departFromUtc = DateTime.UtcNow;
        var departToUtc = departFromUtc.AddDays(weeksAhead * 7);
        return await flightRepository.GetTopDestinationsFromOriginAsync(
            code,
            departFromUtc,
            departToUtc,
            limit,
            cancellationToken);
    }
}
