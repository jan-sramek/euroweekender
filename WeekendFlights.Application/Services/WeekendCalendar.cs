using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public static class WeekendCalendar
{
    public static IReadOnlyList<WeekendDates> GetUpcomingWeekends(int upcomingWeeks, DateTime? referenceUtc = null)
    {
        var weekends = new List<WeekendDates>();
        var today = (referenceUtc ?? DateTime.UtcNow).Date;

        for (var i = 0; i < upcomingWeeks; i++)
        {
            var currentWeek = today.AddDays(i * 7);
            var daysUntilThursday = ((int)DayOfWeek.Thursday - (int)currentWeek.DayOfWeek + 7) % 7;

            var thursday = currentWeek.AddDays(daysUntilThursday);
            var friday = thursday.AddDays(1);
            var saturday = friday.AddDays(1);
            var sunday = thursday.AddDays(3);
            var monday = friday.AddDays(3);

            if (i == 0 && thursday <= today)
                continue;

            weekends.Add(new WeekendDates
            {
                DepartureFrom = thursday,
                DepartureTo = saturday,
                ReturnFrom = sunday,
                ReturnTo = monday
            });
        }

        return weekends;
    }
}
