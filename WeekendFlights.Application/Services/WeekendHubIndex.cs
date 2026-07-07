using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public static class WeekendHubIndex
{
    public const int DefaultWeeksAhead = 4;
    public const double DistancePenaltyExponent = 1.5;

    public static double ComputeHubScore(OriginHubStats stats)
    {
        if (stats.OfferCount <= 0)
            return 0;

        var availability = Math.Log(1 + stats.OfferCount);
        var affordability = 1 / Math.Log(1 + Math.Max(stats.MinPrice, 1));
        var quality = Math.Clamp(stats.AverageQuality / 100, 0.1, 1);
        var variety = Math.Log(1 + stats.DestinationCount);

        return availability * affordability * quality * variety;
    }

    public static double ComputeRankFallbackScore(decimal airportRank)
    {
        if (airportRank <= 0)
            return 0;

        // Kiwi rank: lower number = bigger hub. Map to a score comparable with crawl-based hubs.
        return 12.0 / Math.Log(1 + (double)airportRank + 1);
    }

    public static double ResolveHubScore(OriginHubStats? flightStats, decimal airportRank)
    {
        if (flightStats is { OfferCount: > 0 })
            return ComputeHubScore(flightStats);

        return ComputeRankFallbackScore(airportRank);
    }

    public static double ComputeEffectiveScore(double hubScore, double distanceKm)
    {
        if (hubScore <= 0)
            return 0;

        var distanceFactor = Math.Pow(1 + distanceKm / 100, DistancePenaltyExponent);
        return hubScore / distanceFactor;
    }
}
