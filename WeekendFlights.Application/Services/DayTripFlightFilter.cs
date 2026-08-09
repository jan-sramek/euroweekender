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

    public static bool Matches(Flight flight)
    {
        if (flight.NightsInDest != 0)
            return false;

        if (flight.LocalReturnDeparture is not DateTime returnDepart)
            return false;

        var outbound = flight.LocalDeparture;
        if (outbound.Year != returnDepart.Year
            || outbound.Month != returnDepart.Month
            || outbound.Day != returnDepart.Day)
        {
            return false;
        }

        var outMinutes = outbound.Hour * 60 + outbound.Minute;
        if (outMinutes < MorningFromHour * 60 || outMinutes >= MorningToHour * 60)
            return false;

        var backMinutes = returnDepart.Hour * 60 + returnDepart.Minute;
        return backMinutes >= EveningFromHour * 60;
    }
}
