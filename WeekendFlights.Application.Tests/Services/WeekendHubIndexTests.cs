using Xunit;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application.Tests.Services;

public class WeekendHubIndexTests
{
    [Fact]
    public void ComputeHubScore_ReturnsZero_WhenNoOffers()
    {
        var stats = new OriginHubStats { CityCode = "PRG", OfferCount = 0 };

        Assert.Equal(0, WeekendHubIndex.ComputeHubScore(stats));
    }

    [Fact]
    public void ComputeHubScore_IncreasesWithMoreOffers()
    {
        var low = new OriginHubStats
        {
            CityCode = "PRG",
            OfferCount = 10,
            MinPrice = 50,
            AverageQuality = 80,
            DestinationCount = 5
        };
        var high = new OriginHubStats
        {
            CityCode = "PRG",
            OfferCount = 100,
            MinPrice = 50,
            AverageQuality = 80,
            DestinationCount = 5
        };

        Assert.True(WeekendHubIndex.ComputeHubScore(high) > WeekendHubIndex.ComputeHubScore(low));
    }

    [Fact]
    public void ResolveHubScore_UsesAirportRankFallback_WhenNoFlightStats()
    {
        var score = WeekendHubIndex.ResolveHubScore(null, airportRank: 10);

        Assert.True(score > 0);
    }

    [Fact]
    public void ComputeEffectiveScore_DecreasesWithDistance()
    {
        const double hubScore = 12.5;

        var near = WeekendHubIndex.ComputeEffectiveScore(hubScore, distanceKm: 50);
        var far = WeekendHubIndex.ComputeEffectiveScore(hubScore, distanceKm: 500);

        Assert.True(near > far);
    }
}
