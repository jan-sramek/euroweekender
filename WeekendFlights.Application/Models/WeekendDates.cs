namespace WeekendFlights.Application.Models;

public sealed class WeekendDates
{
    public required DateTime DepartureFrom { get; init; }
    public required DateTime DepartureTo { get; init; }
    public required DateTime ReturnFrom { get; init; }
    public required DateTime ReturnTo { get; init; }
}
