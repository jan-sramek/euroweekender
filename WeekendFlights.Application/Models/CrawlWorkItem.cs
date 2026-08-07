namespace WeekendFlights.Application.Models;

public sealed class CrawlWorkItem
{
    public required string CityCode { get; init; }
    public required WeekendDates Weekend { get; init; }
    public int WeekIndex { get; init; }
    public double Score { get; init; }
}
