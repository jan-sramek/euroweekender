using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class FlightRepository(WeekendFlightsDbContext db) : IFlightRepository
{
    public async Task UpsertFlightsAsync(List<Flight> flights)
    {
        if (flights == null || flights.Count == 0)
            return;

        // Get existing flights by KiwiId
        var existingKiwiIds = flights.Select(f => f.KiwiId).ToList();
        var existingFlights = await db.Flights
            .Where(f => existingKiwiIds.Contains(f.KiwiId))
            .ToDictionaryAsync(f => f.KiwiId, f => f);

        foreach (var flight in flights)
        {
            if (existingFlights.TryGetValue(flight.KiwiId, out var existingFlight))
            {
                // Update existing flight
                UpdateFlightProperties(existingFlight, flight);
                db.Flights.Update(existingFlight);
            }
            else
            {
                // Add new flight
                await db.Flights.AddAsync(flight);
            }
        }

        await db.SaveChangesAsync();
    }

    private static void UpdateFlightProperties(Flight existing, Flight updated)
    {
        existing.BookingToken = updated.BookingToken;
        existing.CountryFrom = updated.CountryFrom;
        existing.CountryTo = updated.CountryTo;
        existing.DeepLink = updated.DeepLink;
        existing.Distance = updated.Distance;
        existing.DurationDeparture = updated.DurationDeparture;
        existing.DurationReturn = updated.DurationReturn;
        existing.DurationTotal = updated.DurationTotal;
        existing.FacilitatedBookingAvailable = updated.FacilitatedBookingAvailable;
        existing.FareAdults = updated.FareAdults;
        existing.FareChildern = updated.FareChildern;
        existing.FareInfants = updated.FareInfants;
        existing.HasAirportChange = updated.HasAirportChange;
        existing.LocalArrival = updated.LocalArrival;
        existing.LocalDeparture = updated.LocalDeparture;
        existing.NightsInDest = updated.NightsInDest;
        existing.PnrCount = updated.PnrCount;
        existing.Price = updated.Price;
        existing.Quality = updated.Quality;
        existing.TechnicalStops = updated.TechnicalStops;
        existing.ThrowAwayTicketing = updated.ThrowAwayTicketing;
        existing.HiddenCityTicketing = updated.HiddenCityTicketing;
        existing.AvailabilitySeats = updated.AvailabilitySeats;
        existing.VirtualInterlining = updated.VirtualInterlining;
        existing.FlyTo = updated.FlyTo;
        existing.FlyFrom = updated.FlyFrom;
        existing.CityFrom = updated.CityFrom;
        existing.CityTo = updated.CityTo;
        existing.CityCodeFrom = updated.CityCodeFrom;
        existing.CityCodeTo = updated.CityCodeTo;
        existing.UtcArrival = updated.UtcArrival;
        existing.UtcDeparture = updated.UtcDeparture;
    }
}
