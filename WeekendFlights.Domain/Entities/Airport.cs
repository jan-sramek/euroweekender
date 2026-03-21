namespace WeekendFlights.Domain.Entities;

public class Airport
{
    public Guid Id { get; set; }
    public int KiwiId { get; set; }
    public string IataCode { get; set; } = null!;
    public string IcaoCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string TimeZone { get; set; } = null!;
    public Guid CityId { get; set; }
    public City City { get; set; } = null!;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int Rank { get; set; }
    public int GlobalRankDestination { get; set; }
    public int DestinationPopularityScore { get; set; }
    public bool IsActive { get; set; } = false;
}