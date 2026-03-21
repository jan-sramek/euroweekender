using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class LocationRepository(WeekendFlightsDbContext db) : ILocationRepository
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
}