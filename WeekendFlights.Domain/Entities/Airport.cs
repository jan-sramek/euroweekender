namespace WeekendFlights.Domain.Entities;

public class Airport
{
    public Guid Id { get; set; }
    public int KiwiId { get; set; }
    public string IataCode { get; set; } = null!;
    public string IcaoCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string TimeZone { get; set; } = null!;
    public string CityKiwiId { get; set; } = null!;
    public Guid CityId { get; set; }
    public City City { get; set; } = null!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public decimal Rank { get; set; }
    public int GlobalRankDestination { get; set; }
    public double DestinationPopularityScore { get; set; }
    public bool IsActive { get; set; } = false;
}