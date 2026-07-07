using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class FlightsImportRepository(WeekendFlightsDbContext db) : IFlightsImportRepository
{
    public async Task<FlightsImport?> GetLatestImportAsync()
    {
        return await db.FlightsImports
            .OrderByDescending(fi => fi.DateTimeUtc)
            .FirstOrDefaultAsync();
    }

    public async Task AddAsync(FlightsImport flightsImport)
    {
        await db.FlightsImports.AddAsync(flightsImport);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(FlightsImport flightsImport)
    {
        db.FlightsImports.Update(flightsImport);
        await db.SaveChangesAsync();
    }

    public async Task<FlightsImport?> GetByIdAsync(int id)
    {
        return await db.FlightsImports
            .FirstOrDefaultAsync(fi => fi.Id == id);
    }
}
