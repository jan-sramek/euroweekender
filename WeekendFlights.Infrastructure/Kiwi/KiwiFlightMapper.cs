using System.Text.Json.Serialization;
using WeekendFlights.Infrastructure.Kiwi.Models;

namespace WeekendFlights.Infrastructure.Kiwi;

internal static class KiwiFlightMapper
{
    public static Domain.Entities.Flight ToDomain(KiwiFlightData data)
    {
        var (returnDepart, returnArrive) = ExtractReturnTimes(data);
        return new Domain.Entities.Flight
        {
            KiwiId = data.Id,
            BookingToken = data.BookingToken,
            CountryFrom = data.CountryFrom?.Name ?? string.Empty,
            CountryTo = data.CountryTo?.Name ?? string.Empty,
            FlyFrom = data.FlyFrom,
            FlyTo = data.FlyTo,
            CityFrom = data.CityFrom,
            CityTo = data.CityTo,
            CityCodeFrom = data.CityCodeFrom,
            CityCodeTo = data.CityCodeTo,
            Distance = data.Distance,
            DurationDeparture = data.Duration?.Departure / 60m ?? 0,
            DurationReturn = data.Duration?.Return / 60m ?? 0,
            DurationTotal = data.Duration?.Total / 60m ?? 0,
            FacilitatedBookingAvailable = data.FacilitatedBookingAvailable,
            FareAdults = data.Fare?.Adults ?? 0,
            FareChildern = data.Fare?.Children ?? 0,
            FareInfants = data.Fare?.Infants ?? 0,
            HasAirportChange = data.HasAirportChange,
            LocalArrival = data.LocalArrival,
            LocalDeparture = data.LocalDeparture,
            LocalReturnDeparture = returnDepart,
            LocalReturnArrival = returnArrive,
            NightsInDest = data.NightsInDest ?? 0,
            PnrCount = data.PnrCount,
            Price = data.Price,
            Quality = data.Quality,
            TechnicalStops = data.TechnicalStops,
            ThrowAwayTicketing = data.ThrowAwayTicketing,
            HiddenCityTicketing = data.HiddenCityTicketing,
            AvailabilitySeats = data.Availability?.Seats ?? 0,
            VirtualInterlining = data.VirtualInterlining,
            UtcArrival = data.UtcArrival,
            UtcDeparture = data.UtcDeparture,
            DeepLink = data.DeepLink
        };
    }

    private static (DateTime? returnDepart, DateTime? returnArrive) ExtractReturnTimes(KiwiFlightData flight)
    {
        if (flight.Route == null || flight.Route.Count == 0)
            return (null, null);

        var returnStartIdx = -1;
        for (var i = 0; i < flight.Route.Count; i++)
        {
            if (flight.Route[i].Return == 1)
            {
                returnStartIdx = i;
                break;
            }
        }

        if (returnStartIdx < 0)
        {
            var lastOutboundIdx = -1;
            for (var i = 0; i < flight.Route.Count; i++)
            {
                if (string.Equals(flight.Route[i].FlyTo, flight.FlyTo, StringComparison.OrdinalIgnoreCase))
                    lastOutboundIdx = i;
            }

            returnStartIdx = lastOutboundIdx + 1;
        }

        if (returnStartIdx < 1 || returnStartIdx >= flight.Route.Count)
            return (null, null);

        var returnDepart = flight.Route[returnStartIdx].LocalDeparture;

        var lastReturnIdx = returnStartIdx;
        for (var i = returnStartIdx; i < flight.Route.Count; i++)
        {
            if (string.Equals(flight.Route[i].FlyTo, flight.FlyFrom, StringComparison.OrdinalIgnoreCase))
                lastReturnIdx = i;
        }

        var returnArrive = flight.Route[lastReturnIdx].LocalArrival;
        return (returnDepart, returnArrive);
    }
}
