namespace WeekendFlights.Application.Services;

/// <summary>
/// Cheap hubs (e.g. Barcelona) fill a cheapest-N Kiwi search around €50.
/// Extra price bands pull in still-cheap €60–€120 fares without raising every search limit.
/// </summary>
public static class CheapFlightCoverage
{
    public const decimal TargetEur = 120;
    public const decimal MidBandEur = 90;
    public const decimal LowBandEur = 60;
    public const int BandLimit = 400;

    public readonly record struct PriceBand(decimal From, decimal To);

    public static decimal DisplayPrice(decimal fareAdults, double price) =>
        fareAdults > 0 ? fareAdults : (decimal)price;

    public static bool NeedsHigherBands(int resultCount, int requestedLimit, decimal maxDisplayPrice) =>
        resultCount > 0
        && resultCount >= requestedLimit
        && maxDisplayPrice < TargetEur;

    /// <summary>
    /// Bands to search after the cheapest batch stops below <see cref="TargetEur"/>.
    /// At most two extra Kiwi calls; the top band always samples €90–€120 when needed.
    /// </summary>
    public static IReadOnlyList<PriceBand> ExtraBands(decimal currentMaxPrice)
    {
        if (currentMaxPrice >= TargetEur)
            return [];

        if (currentMaxPrice < MidBandEur)
            return [new PriceBand(currentMaxPrice, MidBandEur), new PriceBand(MidBandEur, TargetEur)];

        return [new PriceBand(currentMaxPrice, TargetEur)];
    }
}
