namespace WeekendFlights.Application.Models;

public sealed class OriginHubStats
{
    public required string CityCode { get; init; }
    public int OfferCount { get; init; }
    public double MinPrice { get; init; }
    public double AverageQuality { get; init; }
    public int DestinationCount { get; init; }
}
