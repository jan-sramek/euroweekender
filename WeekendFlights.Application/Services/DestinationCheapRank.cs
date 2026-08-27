namespace WeekendFlights.Application.Services;

/// <summary>
/// Rank origin→destination lists by how many cheap fares exist, not total offer volume.
/// Cheap matches the calendar band: green through €70.
/// </summary>
public static class DestinationCheapRank
{
    public const double MaxPriceEur = 70;

    public static bool IsCheap(double price) => price > 0 && price <= MaxPriceEur;

    public static IReadOnlyList<T> Order<T>(
        IEnumerable<T> destinations,
        Func<T, int> cheapOfferCount,
        Func<T, double> minPrice,
        Func<T, int>? offerCount = null)
    {
        var query = destinations
            .OrderByDescending(cheapOfferCount)
            .ThenBy(minPrice);
        if (offerCount != null)
            query = query.ThenByDescending(offerCount);
        return query.ToList();
    }
}
