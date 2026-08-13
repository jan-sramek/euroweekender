using WeekendFlights.Application.Services;
using Xunit;

namespace WeekendFlights.Application.Tests.Services;

public class CheapFlightCoverageTests
{
    [Fact]
    public void ExtraBands_Empty_WhenAlreadyAtTarget()
    {
        Assert.Empty(CheapFlightCoverage.ExtraBands(120));
        Assert.Empty(CheapFlightCoverage.ExtraBands(150));
    }

    [Fact]
    public void ExtraBands_SplitsMidAndTop_WhenCheapestBatchStopsEarly()
    {
        var bands = CheapFlightCoverage.ExtraBands(50);

        Assert.Equal(2, bands.Count);
        Assert.Equal(50, bands[0].From);
        Assert.Equal(90, bands[0].To);
        Assert.Equal(90, bands[1].From);
        Assert.Equal(120, bands[1].To);
    }

    [Fact]
    public void ExtraBands_OnlyTopBand_WhenAlreadyPastMid()
    {
        var bands = CheapFlightCoverage.ExtraBands(95);

        Assert.Single(bands);
        Assert.Equal(95, bands[0].From);
        Assert.Equal(120, bands[0].To);
    }

    [Theory]
    [InlineData(300, 300, 49, true)]
    [InlineData(300, 300, 120, false)]
    [InlineData(80, 300, 40, false)]
    [InlineData(0, 300, 0, false)]
    public void NeedsHigherBands_OnlyWhenCheapestBudgetFilledBelowTarget(
        int resultCount,
        int requestedLimit,
        decimal maxPrice,
        bool expected)
    {
        Assert.Equal(expected, CheapFlightCoverage.NeedsHigherBands(resultCount, requestedLimit, maxPrice));
    }
}
