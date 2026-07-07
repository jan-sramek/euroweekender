namespace WeekendFlights.Domain.Entities;

public class FlightsImport
{
    public int Id { get; set; }
    public DateTime DateTimeUtc { get; set; }
    public string LastCityCode { get; set; } = null!;
}