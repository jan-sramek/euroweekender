using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public static class WeekendCalendar
{
    /// <summary>
    /// Upcoming search windows wide enough for all UI trip patterns:
    /// Wed–Sat outbound and Sun–Tue return (covers Wed–Sun through Fri–Tue).
    /// </summary>
    public static IReadOnlyList<WeekendDates> GetUpcomingWeekends(int upcomingWeeks, DateTime? referenceUtc = null)
    {
        if (upcomingWeeks <= 0)
            return [];

        var weekends = new List<WeekendDates>(upcomingWeeks);
        var today = (referenceUtc ?? DateTime.UtcNow).Date;
        var thursday = NextFutureThursday(today);

        for (var i = 0; i < upcomingWeeks; i++)
        {
            var weekendStart = AsUtcDate(thursday.AddDays(i * 7));
            var departureFrom = AsUtcDate(weekendStart.AddDays(-1)); // Wednesday
            var saturday = AsUtcDate(weekendStart.AddDays(2));
            var sunday = AsUtcDate(weekendStart.AddDays(3));
            var tuesday = AsUtcDate(weekendStart.AddDays(5));

            weekends.Add(new WeekendDates
            {
                WeekendStart = weekendStart,
                DepartureFrom = departureFrom,
                DepartureTo = saturday,
                ReturnFrom = sunday,
                ReturnTo = tuesday
            });
        }

        return weekends;
    }

    private static DateTime NextFutureThursday(DateTime today)
    {
        var daysUntilThursday = ((int)DayOfWeek.Thursday - (int)today.DayOfWeek + 7) % 7;
        var thursday = today.AddDays(daysUntilThursday);

        if (thursday <= today)
            thursday = thursday.AddDays(7);

        return thursday;
    }

    private static DateTime AsUtcDate(DateTime date)
        => DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
}
