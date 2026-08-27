using WeekendFlights.Application.Services;
using Xunit;

namespace WeekendFlights.Application.Tests.Services;

public class DestinationCheapRankTests
{
    [Theory]
    [InlineData(20, true)]
    [InlineData(70, true)]
    [InlineData(71, false)]
    [InlineData(0, false)]
    public void IsCheap_UsesCalendarCheapCeiling(double price, bool expected)
    {
        Assert.Equal(expected, DestinationCheapRank.IsCheap(price));
    }

    [Fact]
    public void Order_PrefersManyCheapFaresOverASingleCheaperOutlier()
    {
        var dests = new[]
        {
            new Dest("LON", Cheap: 4, Min: 29, Offers: 20),
            new Dest("SKP", Cheap: 40, Min: 32, Offers: 48),
            new Dest("FRA", Cheap: 0, Min: 127, Offers: 500)
        };

        var ranked = DestinationCheapRank.Order(dests, d => d.Cheap, d => d.Min, d => d.Offers);

        Assert.Equal(new[] { "SKP", "LON", "FRA" }, ranked.Select(d => d.Code));
    }

    private sealed record Dest(string Code, int Cheap, double Min, int Offers);
}
