using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class FlightRepository(WeekendFlightsDbContext db) : IFlightRepository
{
    
}
