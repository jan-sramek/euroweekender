using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Services;

/// <summary>
/// Shared morning-out / evening-back same-day checks for crawl and live search.
/// </summary>
public static class DayTripFlightFilter
{
    public const int MorningFromHour = 5;
    public const int MorningToHour = 12;
    public const int EveningFromHour = 16;
    public const int MinStayHours = 6;

    public static bool Matches(Flight flight) =>
        Matches(flight.NightsInDest, flight.LocalDeparture, flight.LocalArrival, flight.LocalReturnDeparture);

    public static bool Matches(
        int nightsInDest,
        DateTime localDeparture,
        DateTime localArrival,
        DateTime? localReturnDeparture)
    {
        if (nightsInDest != 0)
            return false;

        if (localReturnDeparture is not DateTime returnDepart)
            return false;

        if (localDeparture.Year != returnDepart.Year
            || localDeparture.Month != returnDepart.Month
            || localDeparture.Day != returnDepart.Day)
        {
            return false;
        }

        var outMinutes = localDeparture.Hour * 60 + localDeparture.Minute;
        if (outMinutes < MorningFromHour * 60 || outMinutes >= MorningToHour * 60)
            return false;

        var backMinutes = returnDepart.Hour * 60 + returnDepart.Minute;
        if (backMinutes < EveningFromHour * 60)
            return false;

        return returnDepart - localArrival >= TimeSpan.FromHours(MinStayHours);
    }
}
