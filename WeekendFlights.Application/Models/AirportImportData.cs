using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Models;

public sealed class AirportImportData
{
    public required List<Airport> Airports { get; init; }
    public required List<City> SupplementalCities { get; init; }
}
