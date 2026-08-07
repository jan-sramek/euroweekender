namespace WeekendFlights.Application.Models;

public sealed class CityWeekendCrawlSnapshot
{
    public required string CityCode { get; init; }
    public required DateTime WeekendStart { get; init; }
    public DateTime LastCrawledUtc { get; init; }
    public int LastOfferCount { get; init; }
}
