namespace WeekendFlights.Application.Models;

public sealed record OriginHubScore(
    string Code,
    int OfferCount,
    double MinPrice,
    double AverageQuality,
    int DestinationCount,
    double HubScore);
