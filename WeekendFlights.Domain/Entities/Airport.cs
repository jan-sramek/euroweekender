namespace WeekendFlights.Domain.Entities;

/// <summary>
/// Represents an airport with its location and metadata.
/// </summary>
public class Airport
{
    /// <summary>
    /// Unique identifier for the airport.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Kiwi.com internal ID for this airport.
    /// </summary>
    public int KiwiId { get; set; }

    /// <summary>
    /// IATA code (e.g., LHR, JFK).
    /// </summary>
    public string IataCode { get; set; } = null!;

    /// <summary>
    /// ICAO code (e.g., EGLL, KJFK).
    /// </summary>
    public string IcaoCode { get; set; } = null!;

    /// <summary>
    /// Full name of the airport.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Timezone identifier for the airport location.
    /// </summary>
    public string TimeZone { get; set; } = null!;

    /// <summary>
    /// Kiwi.com ID of the city this airport belongs to.
    /// </summary>
    public string CityKiwiId { get; set; } = null!;

    /// <summary>
    /// Reference to the parent city entity.
    /// </summary>
    public Guid CityId { get; set; }

    /// <summary>
    /// Navigation property for the parent city.
    /// </summary>
    public City City { get; set; } = null!;

    /// <summary>
    /// Geographic latitude coordinate of the airport.
    /// </summary>
    public double Latitude { get; set; }

    /// <summary>
    /// Geographic longitude coordinate of the airport.
    /// </summary>
    public double Longitude { get; set; }

    /// <summary>
    /// Popularity rank of the airport (lower = more popular).
    /// </summary>
    public decimal Rank { get; set; }

    /// <summary>
    /// Global destination ranking for this airport.
    /// </summary>
    public int GlobalRankDestination { get; set; }

    /// <summary>
    /// Popularity score indicating how popular this destination is.
    /// </summary>
    public double DestinationPopularityScore { get; set; }

    /// <summary>
    /// Indicates whether the airport is active and available for bookings.
    /// </summary>
    public bool IsActive { get; set; } = false;
}
