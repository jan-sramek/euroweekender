using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class CityRepository(WeekendFlightsDbContext db) : ICityRepository
{
    public async Task<List<City>> GetAllCitiesAsync()
    {
        return await db.Cities
            // .Include(c => c.Airports)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }
    public async Task<List<City>> GetActiveCitiesAsync()
    {
        return await db.Cities
            .Where(c => c.IsActive)
            // .Include(c => c.Airports.Where(a => a.IsActive))
            .OrderBy(c => c.Code)
            .ToListAsync();
    }
    public async Task<List<City>> GetCitiesByCodesAsync(List<string> cityCodes)
    {
        return await db.Cities
            .Where(c => cityCodes.Contains(c.Code) && c.IsActive)
            // .Include(c => c.Airports.Where(a => a.IsActive))
            .ToListAsync();
    }

    public async Task<City?> GetCityByCodeAsync(string code)
    {
        return await db.Cities
            // .Include(c => c.Airports.Where(a => a.IsActive))
            .FirstOrDefaultAsync(c => c.Code == code);
    }

    public async Task<City?> GetCityByKiwiIdAsync(string kiwiId)
    {
        return await db.Cities
            // .Include(c => c.Airports.Where(a => a.IsActive))
            .FirstOrDefaultAsync(c => c.KiwiId == kiwiId);
    }

    public async Task<Dictionary<string, decimal>> GetBestAirportRankByCityCodeAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await db.Cities
            .AsNoTracking()
            .Where(c => c.IsActive)
            .Select(c => new
            {
                c.Code,
                BestRank = c.Airports
                    .Where(a => a.Rank > 0)
                    .Select(a => (decimal?)a.Rank)
                    .Min()
            })
            .ToListAsync(cancellationToken);

        return rows
            .Where(r => r.BestRank.HasValue)
            .ToDictionary(r => r.Code, r => r.BestRank!.Value, StringComparer.OrdinalIgnoreCase);
    }

    public async Task AddCityAsync(City city)
    {
        await db.Cities.AddAsync(city);
        await db.SaveChangesAsync();
    }

    public async Task AddCitiesAsync(List<City> cities)
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
        {
            await db.Cities.AddRangeAsync(newCities);
            await db.SaveChangesAsync();
        }
    }

    public async Task UpdateCityAsync(City city)
    {
        db.Cities.Update(city);
        await db.SaveChangesAsync();
    }

    public async Task DeleteCityAsync(Guid cityId)
    {
        var city = await db.Cities.FindAsync(cityId);
        if (city != null)
        {
            db.Cities.Remove(city);
            await db.SaveChangesAsync();
        }
    }
}
