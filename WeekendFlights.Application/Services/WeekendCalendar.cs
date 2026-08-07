using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public static class WeekendCalendar
{
    public static IReadOnlyList<WeekendDates> GetUpcomingWeekends(int upcomingWeeks, DateTime? referenceUtc = null)
    {
        if (upcomingWeeks <= 0)
            return [];

        var weekends = new List<WeekendDates>(upcomingWeeks);
        var today = (referenceUtc ?? DateTime.UtcNow).Date;
        var thursday = NextFutureThursday(today);

        for (var i = 0; i < upcomingWeeks; i++)
        {
            var departureFrom = AsUtcDate(thursday.AddDays(i * 7));
            var saturday = AsUtcDate(departureFrom.AddDays(2));
            var sunday = AsUtcDate(departureFrom.AddDays(3));
            var monday = AsUtcDate(departureFrom.AddDays(4));

            weekends.Add(new WeekendDates
            {
                DepartureFrom = departureFrom,
                DepartureTo = saturday,
                ReturnFrom = sunday,
                ReturnTo = monday
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
