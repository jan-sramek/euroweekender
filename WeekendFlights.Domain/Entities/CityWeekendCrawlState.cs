namespace WeekendFlights.Domain.Entities;

/// <summary>
/// Tracks when a city×weekend pair was last crawled and how many offers came back.
/// </summary>
public class CityWeekendCrawlState
{
    public int Id { get; set; }

    public string CityCode { get; set; } = null!;

    /// <summary>Thursday of the weekend window (UTC date).</summary>
    public DateTime WeekendStart { get; set; }

    public DateTime LastCrawledUtc { get; set; }

    public int LastOfferCount { get; set; }
}
