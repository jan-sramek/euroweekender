namespace WeekendFlights.Application.Models;

public sealed class CrawlOptions
{
    public const string SectionName = "Crawl";

    public int UpcomingWeeks { get; init; } = 4;
    public int MaxCitiesPerRun { get; init; } = 25;
    public int RequestDelayMs { get; init; } = 2000;
    public int IntervalMinutes { get; init; } = 20;
}
