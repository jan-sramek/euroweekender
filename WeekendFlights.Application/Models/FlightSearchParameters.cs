namespace WeekendFlights.Application.Models;

public sealed record FlightSearchParameters
{
    public required string From { get; init; }
    public required DateTime DateFrom { get; init; }
    public required DateTime DateTo { get; init; }
    public DateTime ReturnFrom { get; init; }
    public DateTime ReturnTo { get; init; }
    public int NightsInDstFrom { get; init; }
    public int NightsInDstTo { get; init; }
    public int MaxFlyDuration { get; init; } = 8;
    public int Adults { get; init; } = 1;
    public int Children { get; init; }
    public int Infants { get; init; }
    public decimal PriceTo { get; init; } = 300;
    public decimal MaxStopOvers { get; init; } = 2;
    public string Currency { get; init; } = "EUR";
    public int Limit { get; init; } = 200;

    public static FlightSearchParameters ForWeekendCrawl(string cityCode, WeekendDates weekend) => new()
    {
        From = cityCode,
        DateFrom = weekend.DepartureFrom,
        DateTo = weekend.DepartureTo,
        ReturnFrom = weekend.ReturnFrom,
        ReturnTo = weekend.ReturnTo,
        NightsInDstFrom = 0,
        NightsInDstTo = 4
    };
}
