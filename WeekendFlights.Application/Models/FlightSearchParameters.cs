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
    /// <summary>Outbound depart time window start hour (0–24), inclusive. Null = any.</summary>
    public int? DepartTimeFromHour { get; init; }
    /// <summary>Outbound depart time window end hour (0–24), inclusive. Null = any.</summary>
    public int? DepartTimeToHour { get; init; }
    /// <summary>Return depart time window start hour (0–24), inclusive. Null = any.</summary>
    public int? ReturnDepartTimeFromHour { get; init; }
    /// <summary>Return depart time window end hour (0–24), inclusive. Null = any.</summary>
    public int? ReturnDepartTimeToHour { get; init; }

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

    /// <summary>
    /// Same-day return: out in the morning, back in the evening (0 nights away).
    /// </summary>
    public static FlightSearchParameters ForDayTripCrawl(string cityCode, DateTime day) => new()
    {
        From = cityCode,
        DateFrom = day.Date,
        DateTo = day.Date,
        NightsInDstFrom = 0,
        NightsInDstTo = 0,
        MaxFlyDuration = 5,
        PriceTo = 250,
        MaxStopOvers = 1,
        DepartTimeFromHour = 5,
        DepartTimeToHour = 12,
        ReturnDepartTimeFromHour = 16,
        ReturnDepartTimeToHour = 23
    };
}
