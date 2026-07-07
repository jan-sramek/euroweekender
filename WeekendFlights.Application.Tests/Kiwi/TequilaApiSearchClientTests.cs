using Xunit;
using WeekendFlights.Application.Models;
using WeekendFlights.Infrastructure.Kiwi;

namespace WeekendFlights.Application.Tests.Kiwi;

public class TequilaApiSearchClientTests
{
    [Fact]
    public void BuildSearchUrl_UsesReturnDates_WhenProvided()
    {
        var parameters = new FlightSearchParameters
        {
            From = "PRG",
            DateFrom = new DateTime(2026, 7, 9),
            DateTo = new DateTime(2026, 7, 11),
            ReturnFrom = new DateTime(2026, 7, 12),
            ReturnTo = new DateTime(2026, 7, 13)
        };

        var url = KiwiSearchUrlBuilder.BuildSearchUrl(parameters);

        Assert.Contains("return_from=12/07/2026", url);
        Assert.Contains("return_to=13/07/2026", url);
        Assert.DoesNotContain("nights_in_dst_from", url);
    }

    [Fact]
    public void BuildSearchUrl_UsesNightsInDestination_WhenReturnDatesMissing()
    {
        var parameters = new FlightSearchParameters
        {
            From = "PRG",
            DateFrom = new DateTime(2026, 7, 9),
            DateTo = new DateTime(2026, 7, 11),
            NightsInDstFrom = 2,
            NightsInDstTo = 4
        };

        var url = KiwiSearchUrlBuilder.BuildSearchUrl(parameters);

        Assert.Contains("nights_in_dst_from=2", url);
        Assert.Contains("nights_in_dst_to=4", url);
        Assert.DoesNotContain("return_from", url);
    }
}
