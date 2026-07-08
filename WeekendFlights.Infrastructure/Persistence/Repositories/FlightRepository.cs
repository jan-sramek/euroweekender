using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class FlightRepository(WeekendFlightsDbContext db) : IFlightRepository
{
    public async Task UpsertFlightsAsync(List<Flight> flights)
    {
        if (flights == null || flights.Count == 0)
            return;
        
        flights = flights
            .GroupBy(f => f.KiwiId)
            .Select(g => g.First())
            .ToList();

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
                var changed = UpdateFlightProperties(existingFlight, flight);
                if (changed)
                {
                    db.Flights.Update(existingFlight);
                }
            }
            else
            {
                // Add new flight
                await db.Flights.AddAsync(flight);
            }
        }

        await db.SaveChangesAsync();
    }

    public async Task<int> DeleteOldFlightsAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default)
    {
        return await db.Flights
            .Where(f => f.UtcDeparture < cutoffUtc)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Flight> Flights, int TotalCount)> GetFlightsAsync(
        string? cityCodeFrom,
        string? cityCodeTo,
        DateTime? departFromUtc,
        DateTime? departToUtc,
        int skip,
        int take,
        bool includeTotal = true,
        CancellationToken cancellationToken = default)
    {
        take = Math.Clamp(take, 1, 1000);
        skip = Math.Max(0, skip);

        var cityCodes = ParseCityCodes(cityCodeFrom);
        if (cityCodes.Length > 1 && skip == 0)
        {
            return await GetFlightsPerCityAsync(
                cityCodes, cityCodeTo, departFromUtc, departToUtc, take, cancellationToken);
        }

        var query = BuildFlightSearchQuery(cityCodes, cityCodeTo, departFromUtc, departToUtc);

        var totalCount = includeTotal
            ? await query.CountAsync(cancellationToken)
            : 0;

        var flights = await query
            .OrderBy(f => f.Price)
            .ThenBy(f => f.UtcDeparture)
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return (flights, totalCount);
    }

    private async Task<(IReadOnlyList<Flight> Flights, int TotalCount)> GetFlightsPerCityAsync(
        string[] cityCodes,
        string? cityCodeTo,
        DateTime? departFromUtc,
        DateTime? departToUtc,
        int take,
        CancellationToken cancellationToken)
    {
        var perCityTake = Math.Max(50, (int)Math.Ceiling((double)take / cityCodes.Length));
        var byId = new Dictionary<int, Flight>();

        foreach (var code in cityCodes)
        {
            var cityFlights = await BuildFlightSearchQuery([code], cityCodeTo, departFromUtc, departToUtc)
                .OrderBy(f => f.Price)
                .ThenBy(f => f.UtcDeparture)
                .Take(perCityTake)
                .ToListAsync(cancellationToken);

            foreach (var flight in cityFlights)
                byId.TryAdd(flight.Id, flight);
        }

        var merged = byId.Values
            .OrderBy(f => f.Price)
            .ThenBy(f => f.UtcDeparture)
            .Take(take)
            .ToList();

        return (merged, 0);
    }

    private IQueryable<Flight> BuildFlightSearchQuery(
        string[] cityCodes,
        string? cityCodeTo,
        DateTime? departFromUtc,
        DateTime? departToUtc)
    {
        var query = db.Flights
            .AsNoTracking()
            .Where(f => f.UtcDeparture >= DateTime.UtcNow);

        if (cityCodes.Length > 0)
            query = WhereCityCodeFromIn(query, cityCodes);

        if (!string.IsNullOrWhiteSpace(cityCodeTo))
            query = query.Where(f => f.CityCodeTo == cityCodeTo);

        if (departFromUtc.HasValue)
            query = query.Where(f => f.UtcDeparture >= departFromUtc.Value);

        if (departToUtc.HasValue)
            query = query.Where(f => f.UtcDeparture <= departToUtc.Value);

        return query;
    }

    private static string[] ParseCityCodes(string? cityCodeFrom)
    {
        if (string.IsNullOrWhiteSpace(cityCodeFrom))
            return [];

        return cityCodeFrom
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(c => c.ToUpperInvariant())
            .Distinct()
            .ToArray();
    }

    public async Task<IReadOnlyList<OriginHubStats>> GetOriginHubStatsAsync(
        DateTime departFromUtc,
        DateTime departToUtc,
        CancellationToken cancellationToken = default)
    {
        var stats = await db.Flights
            .AsNoTracking()
            .Where(f => f.UtcDeparture >= departFromUtc && f.UtcDeparture <= departToUtc)
            .GroupBy(f => f.CityCodeFrom)
            .Select(g => new OriginHubStats
            {
                CityCode = g.Key,
                OfferCount = g.Count(),
                MinPrice = g.Min(f => f.Price),
                AverageQuality = g.Average(f => f.Quality),
                DestinationCount = g.Select(f => f.CityCodeTo).Distinct().Count()
            })
            .OrderByDescending(s => s.OfferCount)
            .ToListAsync(cancellationToken);

        return stats;
    }

    public async Task<IReadOnlyList<string>> GetOriginCityCodesMissingReturnTimesAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.Flights
            .AsNoTracking()
            .Where(f => f.UtcDeparture >= DateTime.UtcNow && f.LocalReturnDeparture == null)
            .Select(f => f.CityCodeFrom)
            .Distinct()
            .OrderBy(code => code)
            .ToListAsync(cancellationToken);
    }

    private static IQueryable<Flight> WhereCityCodeFromIn(IQueryable<Flight> query, string[] codes)
    {
        if (codes.Length == 0)
            return query;

        if (codes.Length == 1)
            return query.Where(f => f.CityCodeFrom == codes[0]);

        // EF Core can mistranslate array.Contains(column) for PostgreSQL; build explicit OR instead.
        var parameter = System.Linq.Expressions.Expression.Parameter(typeof(Flight), "f");
        var cityCodeFrom = System.Linq.Expressions.Expression.Property(parameter, nameof(Flight.CityCodeFrom));

        System.Linq.Expressions.Expression? orExpression = null;
        foreach (var code in codes)
        {
            var equals = System.Linq.Expressions.Expression.Equal(
                cityCodeFrom,
                System.Linq.Expressions.Expression.Constant(code));
            orExpression = orExpression == null
                ? equals
                : System.Linq.Expressions.Expression.OrElse(orExpression, equals);
        }

        var lambda = System.Linq.Expressions.Expression.Lambda<Func<Flight, bool>>(orExpression!, parameter);
        return query.Where(lambda);
    }

    private static bool UpdateFlightProperties(Flight existing, Flight updated)
    {
        var changed = false;

        changed |= SetIfChanged(existing.BookingToken, updated.BookingToken, v => existing.BookingToken = v);
        changed |= SetIfChanged(existing.CountryFrom, updated.CountryFrom, v => existing.CountryFrom = v);
        changed |= SetIfChanged(existing.CountryTo, updated.CountryTo, v => existing.CountryTo = v);
        changed |= SetIfChanged(existing.DeepLink, updated.DeepLink, v => existing.DeepLink = v);
        changed |= SetIfChanged(existing.Distance, updated.Distance, v => existing.Distance = v);
        changed |= SetIfChanged(existing.DurationDeparture, updated.DurationDeparture, v => existing.DurationDeparture = v);
        changed |= SetIfChanged(existing.DurationReturn, updated.DurationReturn, v => existing.DurationReturn = v);
        changed |= SetIfChanged(existing.DurationTotal, updated.DurationTotal, v => existing.DurationTotal = v);
        changed |= SetIfChanged(existing.FacilitatedBookingAvailable, updated.FacilitatedBookingAvailable, v => existing.FacilitatedBookingAvailable = v);
        changed |= SetIfChanged(existing.FareAdults, updated.FareAdults, v => existing.FareAdults = v);
        changed |= SetIfChanged(existing.FareChildern, updated.FareChildern, v => existing.FareChildern = v);
        changed |= SetIfChanged(existing.FareInfants, updated.FareInfants, v => existing.FareInfants = v);
        changed |= SetIfChanged(existing.HasAirportChange, updated.HasAirportChange, v => existing.HasAirportChange = v);
        changed |= SetIfChanged(existing.LocalArrival, updated.LocalArrival, v => existing.LocalArrival = v);
        changed |= SetIfChanged(existing.LocalDeparture, updated.LocalDeparture, v => existing.LocalDeparture = v);
        changed |= SetIfChanged(existing.LocalReturnDeparture, updated.LocalReturnDeparture, v => existing.LocalReturnDeparture = v);
        changed |= SetIfChanged(existing.LocalReturnArrival, updated.LocalReturnArrival, v => existing.LocalReturnArrival = v);
        changed |= SetIfChanged(existing.NightsInDest, updated.NightsInDest, v => existing.NightsInDest = v);
        changed |= SetIfChanged(existing.PnrCount, updated.PnrCount, v => existing.PnrCount = v);
        changed |= SetIfChanged(existing.Price, updated.Price, v => existing.Price = v);
        changed |= SetIfChanged(existing.Quality, updated.Quality, v => existing.Quality = v);
        changed |= SetIfChanged(existing.TechnicalStops, updated.TechnicalStops, v => existing.TechnicalStops = v);
        changed |= SetIfChanged(existing.ThrowAwayTicketing, updated.ThrowAwayTicketing, v => existing.ThrowAwayTicketing = v);
        changed |= SetIfChanged(existing.HiddenCityTicketing, updated.HiddenCityTicketing, v => existing.HiddenCityTicketing = v);
        changed |= SetIfChanged(existing.AvailabilitySeats, updated.AvailabilitySeats, v => existing.AvailabilitySeats = v);
        changed |= SetIfChanged(existing.VirtualInterlining, updated.VirtualInterlining, v => existing.VirtualInterlining = v);
        changed |= SetIfChanged(existing.FlyTo, updated.FlyTo, v => existing.FlyTo = v);
        changed |= SetIfChanged(existing.FlyFrom, updated.FlyFrom, v => existing.FlyFrom = v);
        changed |= SetIfChanged(existing.CityFrom, updated.CityFrom, v => existing.CityFrom = v);
        changed |= SetIfChanged(existing.CityTo, updated.CityTo, v => existing.CityTo = v);
        changed |= SetIfChanged(existing.CityCodeFrom, updated.CityCodeFrom, v => existing.CityCodeFrom = v);
        changed |= SetIfChanged(existing.CityCodeTo, updated.CityCodeTo, v => existing.CityCodeTo = v);
        changed |= SetIfChanged(existing.UtcArrival, updated.UtcArrival, v => existing.UtcArrival = v);
        changed |= SetIfChanged(existing.UtcDeparture, updated.UtcDeparture, v => existing.UtcDeparture = v);

        return changed;
    }
    
    private static bool SetIfChanged<T>(T current, T updated, Action<T> setter)
    {
        if (!EqualityComparer<T>.Default.Equals(current, updated))
        {
            setter(updated);
            return true;
        }

        return false;
    }
}
