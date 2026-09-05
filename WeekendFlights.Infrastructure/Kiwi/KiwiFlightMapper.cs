using WeekendFlights.Infrastructure.Kiwi.Models;

namespace WeekendFlights.Infrastructure.Kiwi;

internal static class KiwiFlightMapper
{
    public static Domain.Entities.Flight ToDomain(KiwiFlightData data)
    {
        var (returnDepart, returnArrive) = ExtractReturnTimes(data);
        var (outboundStops, returnStops) = CountConnectionStops(data);
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
            TechnicalStops = outboundStops,
            TechnicalStopsReturn = returnStops,
            ThrowAwayTicketing = data.ThrowAwayTicketing,
            HiddenCityTicketing = data.HiddenCityTicketing,
            // null when Kiwi omits availability — do not coerce to 0 (frontend treats 0 as unknown too)
            AvailabilitySeats = data.Availability?.Seats,
            VirtualInterlining = data.VirtualInterlining,
            UtcArrival = data.UtcArrival,
            UtcDeparture = data.UtcDeparture,
            DeepLink = data.DeepLink
        };
    }

    /// <summary>
    /// Passenger connection changes per leg = flight segments − 1.
    /// Kiwi's technical_stops only counts same-plane technical stops, not transfers.
    /// </summary>
    internal static (int outboundStops, int returnStops) CountConnectionStops(KiwiFlightData flight)
    {
        if (flight.Route == null || flight.Route.Count == 0)
            return (Math.Max(0, flight.TechnicalStops), 0);

        var returnStartIdx = FindReturnStartIndex(flight);
        int outboundSegments;
        int returnSegments;

        if (returnStartIdx > 0 && returnStartIdx < flight.Route.Count)
        {
            outboundSegments = returnStartIdx;
            returnSegments = flight.Route.Count - returnStartIdx;
        }
        else
        {
            outboundSegments = flight.Route.Count;
            returnSegments = 0;
        }

        return (Math.Max(0, outboundSegments - 1), Math.Max(0, returnSegments - 1));
    }

    private static (DateTime? returnDepart, DateTime? returnArrive) ExtractReturnTimes(KiwiFlightData flight)
    {
        if (flight.Route == null || flight.Route.Count == 0)
            return (null, null);

        var returnStartIdx = FindReturnStartIndex(flight);
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

    private static int FindReturnStartIndex(KiwiFlightData flight)
    {
        if (flight.Route == null || flight.Route.Count == 0)
            return -1;

        for (var i = 0; i < flight.Route.Count; i++)
        {
            if (flight.Route[i].Return == 1)
                return i;
        }

        var lastOutboundIdx = -1;
        for (var i = 0; i < flight.Route.Count; i++)
        {
            if (string.Equals(flight.Route[i].FlyTo, flight.FlyTo, StringComparison.OrdinalIgnoreCase))
                lastOutboundIdx = i;
        }

        return lastOutboundIdx + 1;
    }
}
