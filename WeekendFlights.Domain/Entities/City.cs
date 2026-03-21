namespace WeekendFlights.Domain.Entities;

public class City
{
    public Guid Id { get; set; }
    public required string KiwiId { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string Country { get; set; } = null!;
    public string? Region { get; set; }
    public string Continent { get; set; } = null!;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    
    public bool IsActive { get; set; } = false;

    public List<Airport> Airports { get; set; } = new();
}