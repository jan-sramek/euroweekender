using Xunit;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application.Tests.Services;

public class WeekendCalendarTests
{
    [Fact]
    public void GetUpcomingWeekends_ReturnsRequestedCount()
    {
        var reference = new DateTime(2026, 7, 6, 12, 0, 0, DateTimeKind.Utc); // Monday

        var weekends = WeekendCalendar.GetUpcomingWeekends(4, reference);

        Assert.Equal(4, weekends.Count);
    }

    [Fact]
    public void GetUpcomingWeekends_ReturnsExactlyNAcrossMidWeek()
    {
        var reference = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc); // Friday

        var weekends = WeekendCalendar.GetUpcomingWeekends(52, reference);

        Assert.Equal(52, weekends.Count);
        Assert.Equal(new DateTime(2026, 7, 16, 0, 0, 0, DateTimeKind.Utc), weekends[0].WeekendStart);
        Assert.Equal(new DateTime(2026, 7, 15, 0, 0, 0, DateTimeKind.Utc), weekends[0].DepartureFrom);
        Assert.Equal(new DateTime(2027, 7, 8, 0, 0, 0, DateTimeKind.Utc), weekends[51].WeekendStart);
    }

    [Fact]
    public void GetUpcomingWeekends_SkipsPastThursdayInCurrentWeek()
    {
        var reference = new DateTime(2026, 7, 10, 12, 0, 0, DateTimeKind.Utc); // Friday

        var weekends = WeekendCalendar.GetUpcomingWeekends(1, reference);

        Assert.Single(weekends);
        Assert.True(weekends[0].WeekendStart > reference.Date);
        Assert.Equal(DayOfWeek.Thursday, weekends[0].WeekendStart.DayOfWeek);
    }

    [Fact]
    public void GetUpcomingWeekends_UsesWednesdayToSaturdayDeparturesAndSundayToTuesdayReturns()
    {
        var reference = new DateTime(2026, 7, 6, 12, 0, 0, DateTimeKind.Utc); // Monday

        var weekend = WeekendCalendar.GetUpcomingWeekends(1, reference).Single();

        Assert.Equal(DayOfWeek.Thursday, weekend.WeekendStart.DayOfWeek);
        Assert.Equal(DayOfWeek.Wednesday, weekend.DepartureFrom.DayOfWeek);
        Assert.Equal(DayOfWeek.Saturday, weekend.DepartureTo.DayOfWeek);
        Assert.Equal(DayOfWeek.Sunday, weekend.ReturnFrom.DayOfWeek);
        Assert.Equal(DayOfWeek.Tuesday, weekend.ReturnTo.DayOfWeek);
        Assert.Equal(DateTimeKind.Utc, weekend.DepartureFrom.Kind);
        Assert.Equal(weekend.WeekendStart.AddDays(-1), weekend.DepartureFrom);
    }
}
