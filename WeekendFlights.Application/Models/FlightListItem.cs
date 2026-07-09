namespace WeekendFlights.Application.Models;

public sealed class FlightListItem
{
    public int Id { get; init; }
    public string? DeepLink { get; init; }
    public decimal FareAdults { get; init; }
    public int NightsInDest { get; init; }
    public double Price { get; init; }
    public int TechnicalStops { get; init; }
    public decimal DurationReturn { get; init; }
    public string FlyTo { get; init; } = "";
    public string FlyFrom { get; init; } = "";
    public string CityFrom { get; init; } = "";
    public string CityTo { get; init; } = "";
    public string CityCodeFrom { get; init; } = "";
    public string CityCodeTo { get; init; } = "";
    public string CountryTo { get; init; } = "";
    public DateTime LocalArrival { get; init; }
    public DateTime LocalDeparture { get; init; }
    public DateTime? LocalReturnDeparture { get; init; }
    public DateTime? LocalReturnArrival { get; init; }
    public int? AvailabilitySeats { get; init; }
    public DateTime UtcDeparture { get; init; }
}
