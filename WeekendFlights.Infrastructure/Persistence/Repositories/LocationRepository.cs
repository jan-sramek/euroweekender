using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class LocationRepository(WeekendFlightsDbContext db, ILogger<LocationRepository> logger) : ILocationRepository
{

    public async Task SaveCitiesAsync(List<City> cities)
    {
        var cityIds = cities.Select(c => c.KiwiId).ToList();

        var existingIds = await db.Cities
            .Where(c => cityIds.Contains(c.KiwiId))
            .Select(c => c.KiwiId)
            .ToListAsync();

        var existingSet = existingIds.ToHashSet();

        var newCities = cities
            .Where(c => !existingSet.Contains(c.KiwiId))
            .ToList();

        if (newCities.Count > 0)
            db.Cities.AddRange(newCities);

        await db.SaveChangesAsync();
    }
    
    public async Task SaveAirport(Airport airport, string cityKiwiId)
    {
        // Find the city by its KiwiId
        var city = await db.Cities
            .FirstOrDefaultAsync(c => c.KiwiId == cityKiwiId);

        if (city == null)
        {
            throw new ArgumentException($"City with KiwiId '{cityKiwiId}' not found", nameof(cityKiwiId));
        }

        // Check if airport already exists
        var existingAirport = await db.Airports
            .FirstOrDefaultAsync(a => a.IataCode == airport.IataCode);

        if (existingAirport == null)
        {
            // Add new airport
            airport.CityId = city.Id; // Set the foreign key
            db.Airports.Add(airport);
        }
        else
        {
            // Update existing airport
            existingAirport.IcaoCode = airport.IcaoCode;
            existingAirport.Name = airport.Name;
            existingAirport.TimeZone = airport.TimeZone;
            existingAirport.Latitude = airport.Latitude;
            existingAirport.Longitude = airport.Longitude;
            existingAirport.Rank = airport.Rank;
            existingAirport.GlobalRankDestination = airport.GlobalRankDestination;
            existingAirport.DestinationPopularityScore = airport.DestinationPopularityScore;
            existingAirport.CityId = city.Id; // Ensure the foreign key is set
            
            db.Airports.Update(existingAirport);
        }

        await db.SaveChangesAsync();
    }
    
    public async Task SaveAirports(List<Airport> airports)
    {
        if (airports == null || airports.Count == 0)
            return;

        // Get all unique city KiwiIds from the airports
        var cityKiwiIds = airports.Select(a => a.CityKiwiId).Distinct().ToList();
        
        // Find all cities by their KiwiIds
        var cities = await db.Cities
            .Where(c => cityKiwiIds.Contains(c.KiwiId))
            .ToDictionaryAsync(c => c.KiwiId, c => c);

        // Get existing airports by IataCode
        var airportIataCodes = airports.Select(a => a.IataCode).Distinct().ToList();
        var existingAirports = await db.Airports
            .Where(a => airportIataCodes.Contains(a.IataCode))
            .ToDictionaryAsync(a => a.IataCode, a => a);

        var processedIataCodes = new HashSet<string>();
        foreach (var airport in airports)
        {
            if (!processedIataCodes.Add(airport.IataCode))
            {
                logger.LogWarning($"Duplicate IataCode '{airport.IataCode}' found in incoming batch, skipping");
                continue;
            }
            
            // Find the city for this airport
            if (!cities.TryGetValue(airport.CityKiwiId, out var city))
            {
                // throw new ArgumentException();
                logger.LogError($"City with KiwiId '{airport.CityKiwiId}' not found for airport '{airport.IataCode}'");
                continue;
            }

            // Set the CityId foreign key
            airport.CityId = city.Id;

            // Check if airport already exists
            if (existingAirports.TryGetValue(airport.IataCode, out var existingAirport))
            {
                // Update existing airport
                existingAirport.IcaoCode = airport.IcaoCode;
                existingAirport.Name = airport.Name;
                existingAirport.TimeZone = airport.TimeZone;
                existingAirport.Latitude = airport.Latitude;
                existingAirport.Longitude = airport.Longitude;
                existingAirport.Rank = airport.Rank;
                existingAirport.GlobalRankDestination = airport.GlobalRankDestination;
                existingAirport.DestinationPopularityScore = airport.DestinationPopularityScore;
                existingAirport.CityId = city.Id;
                existingAirport.IsActive = airport.IsActive;
                
                db.Airports.Update(existingAirport);
            }
            else
            {
                // Add new airport
                db.Airports.Add(airport);
            }
        }

        await db.SaveChangesAsync();
    }
}