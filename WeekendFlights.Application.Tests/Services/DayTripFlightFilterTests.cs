using Xunit;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application.Tests.Services;

public class DayTripFlightFilterTests
{
    [Fact]
    public void Matches_AcceptsMorningOutEveningBackWithSixHourStay()
    {
        var ok = DayTripFlightFilter.Matches(
            nightsInDest: 0,
            localDeparture: new DateTime(2026, 8, 10, 7, 30, 0),
            localArrival: new DateTime(2026, 8, 10, 10, 0, 0),
            localReturnDeparture: new DateTime(2026, 8, 10, 16, 0, 0));

        Assert.True(ok);
    }

    [Fact]
    public void Matches_RejectsStayShorterThanSixHours()
    {
        var tooShort = DayTripFlightFilter.Matches(
            nightsInDest: 0,
            localDeparture: new DateTime(2026, 8, 10, 7, 30, 0),
            localArrival: new DateTime(2026, 8, 10, 12, 30, 0),
            localReturnDeparture: new DateTime(2026, 8, 10, 18, 0, 0));

        Assert.False(tooShort);
    }

    [Fact]
    public void Matches_RejectsAfternoonOutbound()
    {
        var lateOut = DayTripFlightFilter.Matches(
            nightsInDest: 0,
            localDeparture: new DateTime(2026, 8, 10, 14, 0, 0),
            localArrival: new DateTime(2026, 8, 10, 15, 0, 0),
            localReturnDeparture: new DateTime(2026, 8, 10, 21, 0, 0));

        Assert.False(lateOut);
    }
}
