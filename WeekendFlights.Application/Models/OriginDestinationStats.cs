namespace WeekendFlights.Application.Models;

public sealed class OriginDestinationStats
{
    public required string CityCodeFrom { get; init; }
    public required string CityCodeTo { get; init; }
    public int OfferCount { get; init; }
    public int CheapOfferCount { get; init; }
    public double MinPrice { get; init; }
}
