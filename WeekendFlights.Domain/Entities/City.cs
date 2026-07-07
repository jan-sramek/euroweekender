namespace WeekendFlights.Domain.Entities;

/// <summary>
/// Represents a city in the system with associated airports.
/// </summary>
public class City
{
    /// <summary>
    /// Unique identifier for the city.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Kiwi.com internal ID for the city.
    /// </summary>
    public required string KiwiId { get; set; }

    /// <summary>
    /// Human-readable name of the city.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// IATA code for the city.
    /// </summary>
    public string Code { get; set; } = null!;

    /// <summary>
    /// Country where the city is located.
    /// </summary>
    public string Country { get; set; } = null!;

    /// <summary>
    /// Region within the country (e.g., state, province).
    /// </summary>
    public string? Region { get; set; }

    /// <summary>
    /// Continent where the city is located.
    /// </summary>
    public string Continent { get; set; } = null!;

    /// <summary>
    /// Geographic latitude coordinate.
    /// </summary>
    public decimal Latitude { get; set; }

    /// <summary>
    /// Geographic longitude coordinate.
    /// </summary>
    public decimal Longitude { get; set; }

    /// <summary>
    /// Indicates whether the city is active and available for bookings.
    /// </summary>
    public bool IsActive { get; set; } = false;

    /// <summary>
    /// Collection of airports associated with this city.
    /// </summary>
    public List<Airport> Airports { get; set; } = new();
}
