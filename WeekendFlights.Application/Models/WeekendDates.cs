namespace WeekendFlights.Application.Models;

public sealed class WeekendDates
{
    /// <summary>Stable Thursday identity used for crawl-state keys.</summary>
    public required DateTime WeekendStart { get; init; }

    public required DateTime DepartureFrom { get; init; }
    public required DateTime DepartureTo { get; init; }
    public required DateTime ReturnFrom { get; init; }
    public required DateTime ReturnTo { get; init; }
}
