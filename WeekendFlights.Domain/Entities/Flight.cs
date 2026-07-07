namespace WeekendFlights.Domain.Entities;

/// <summary>
/// Represents a flight itinerary from one city to another.
/// </summary>
public class Flight
{
    /// <summary>
    /// Primary key for the flight record.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Kiwi.com internal identifier for this flight.
    /// </summary>
    public required string KiwiId { get; set; }

    /// <summary>
    /// Unique booking token for direct booking on Kiwi.com.
    /// </summary>
    public string BookingToken { get; set; } = null!;

    /// <summary>
    /// Country of departure.
    /// </summary>
    public string CountryFrom { get; set; } = null!;

    /// <summary>
    /// Country of destination.
    /// </summary>
    public string CountryTo { get; set; } = null!;

    /// <summary>
    /// Direct booking URL on Kiwi.com platform.
    /// </summary>
    public string? DeepLink { get; set; }

    /// <summary>
    /// Distance between departure and destination in kilometers.
    /// </summary>
    public double Distance { get; set; }

    /// <summary>
    /// Duration of outbound journey in hours.
    /// </summary>
    public decimal DurationDeparture { get; set; }

    /// <summary>
    /// Duration of return journey in hours.
    /// </summary>
    public decimal DurationReturn { get; set; }

    /// <summary>
    /// Total duration of the round trip in hours.
    /// </summary>
    public decimal DurationTotal { get; set; }

    /// <summary>
    /// Indicates if facilitated booking is available for this flight.
    /// </summary>
    public bool FacilitatedBookingAvailable { get; set; }

    /// <summary>
    /// Fare price for adult passengers.
    /// </summary>
    public decimal FareAdults { get; set; }

    /// <summary>
    /// Fare price for children passengers.
    /// </summary>
    public decimal FareChildern { get; set; }

    /// <summary>
    /// Fare price for infant passengers.
    /// </summary>
    public decimal FareInfants { get; set; }

    /// <summary>
    /// Indicates if the flight has an airport change during the journey.
    /// </summary>
    public bool HasAirportChange { get; set; }

    /// <summary>
    /// Local date and time of arrival at destination.
    /// </summary>
    public DateTime LocalArrival { get; set; }

    /// <summary>
    /// Local date and time of departure from origin.
    /// </summary>
    public DateTime LocalDeparture { get; set; }

    /// <summary>
    /// Local date and time of return departure from destination (from Kiwi route segment).
    /// </summary>
    public DateTime? LocalReturnDeparture { get; set; }

    /// <summary>
    /// Local date and time of return arrival at origin (from Kiwi route segment).
    /// </summary>
    public DateTime? LocalReturnArrival { get; set; }

    /// <summary>
    /// Number of nights spent at destination.
    /// </summary>
    public int NightsInDest { get; set; }

    /// <summary>
    /// Total price of the flight in local currency.
    /// </summary>
    public double Price { get; set; }

    /// <summary>
    /// Quality score indicating how good this option is (higher = better).
    /// </summary>
    public double Quality { get; set; }

    /// <summary>
    /// Number of PNRs (booking references) required for this itinerary.
    /// </summary>
    public int PnrCount { get; set; }

    /// <summary>
    /// Number of technical stops during the journey.
    /// </summary>
    public int TechnicalStops { get; set; }

    /// <summary>
    /// Indicates if throwaway ticketing is available (one-way booking).
    /// </summary>
    public bool ThrowAwayTicketing { get; set; }

    /// <summary>
    /// Indicates if hidden city ticketing is applicable.
    /// </summary>
    public bool HiddenCityTicketing { get; set; }

    /// <summary>
    /// Available seats for this flight (null if not available).
    /// </summary>
    public int? AvailabilitySeats { get; set; }

    /// <summary>
    /// Indicates if virtual interlining is supported.
    /// </summary>
    public bool VirtualInterlining { get; set; }

    /// <summary>
    /// Destination city name.
    /// </summary>
    public string FlyTo { get; set; } = null!;

    /// <summary>
    /// Origin city name.
    /// </summary>
    public string FlyFrom { get; set; } = null!;

    /// <summary>
    /// Destination city name (alternative field).
    /// </summary>
    public string CityTo { get; set; } = null!;

    /// <summary>
    /// Origin city name (alternative field).
    /// </summary>
    public string CityFrom { get; set; } = null!;

    /// <summary>
    /// IATA code of origin city.
    /// </summary>
    public string CityCodeFrom { get; set; } = null!;

    /// <summary>
    /// IATA code of destination city.
    /// </summary>
    public string CityCodeTo { get; set; } = null!;

    /// <summary>
    /// UTC date and time of arrival at destination.
    /// </summary>
    public DateTime UtcArrival { get; set; }

    /// <summary>
    /// UTC date and time of departure from origin.
    /// </summary>
    public DateTime UtcDeparture { get; set; }
}
