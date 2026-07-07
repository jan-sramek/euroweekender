using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface IFlightsImportRepository
{
    Task<FlightsImport?> GetLatestImportAsync();
    Task AddAsync(FlightsImport flightsImport);
    Task UpdateAsync(FlightsImport flightsImport);
    Task<FlightsImport?> GetByIdAsync(int id);
}
