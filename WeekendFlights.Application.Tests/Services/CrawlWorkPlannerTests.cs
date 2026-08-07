using Xunit;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application.Tests.Services;

public class CrawlWorkPlannerTests
{
    private static CrawlOptions CreateOptions(int maxSearchesPerRun = 10) => new()
    {
        UpcomingWeeks = 52,
        MaxSearchesPerRun = maxSearchesPerRun,
        NearTermWeeks = 4,
        MidTermWeeks = 12,
        FarTermWeeks = 26,
        NearTermMaxAgeHours = 12,
        MidTermMaxAgeHours = 72,
        FarTermMaxAgeHours = 168,
        DistantTermMaxAgeHours = 336
    };

    private static readonly DateTime Now = new(2026, 7, 6, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Plan_PrefersNearTermOverFarWhenBothDue()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(8, Now);
        var cities = new[] { "PRG" };
        var offerCounts = new Dictionary<string, int> { ["PRG"] = 10 };
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>();

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(1), Now);

        Assert.Single(plan);
        Assert.Equal(0, plan[0].WeekIndex);
    }

    [Fact]
    public void Plan_BusyCityOutranksQuietCityWhenBothDue()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(1, Now);
        var cities = new[] { "AAA", "BBB" };
        var offerCounts = new Dictionary<string, int>
        {
            ["AAA"] = 5,
            ["BBB"] = 200
        };
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>();

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(1), Now);

        Assert.Single(plan);
        Assert.Equal("BBB", plan[0].CityCode);
    }

    [Fact]
    public void Plan_ZeroOfferCityStillGetsScheduled()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(1, Now);
        var cities = new[] { "QQQ" };
        var offerCounts = new Dictionary<string, int>();
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>();

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(), Now);

        Assert.Single(plan);
        Assert.Equal("QQQ", plan[0].CityCode);
    }

    [Fact]
    public void Plan_RespectsMaxSearchesBudget()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(10, Now);
        var cities = new[] { "PRG", "VIE", "BUD" };
        var offerCounts = new Dictionary<string, int>();
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>();

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(7), Now);

        Assert.Equal(7, plan.Count);
    }

    [Fact]
    public void Plan_SkipsFreshNearTermPairs()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(1, Now);
        var weekendStart = weekends[0].DepartureFrom;
        var cities = new[] { "PRG" };
        var offerCounts = new Dictionary<string, int> { ["PRG"] = 50 };
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>
        {
            [("PRG", weekendStart)] = new CityWeekendCrawlSnapshot
            {
                CityCode = "PRG",
                WeekendStart = weekendStart,
                LastCrawledUtc = Now.AddHours(-1),
                LastOfferCount = 50
            }
        };

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(), Now);

        Assert.Empty(plan);
    }

    [Fact]
    public void Plan_IncludesOverdueFarTermBeforeFreshNearTerm()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(20, Now);
        var cities = new[] { "PRG" };
        var offerCounts = new Dictionary<string, int> { ["PRG"] = 20 };
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>
        {
            [("PRG", weekends[0].DepartureFrom)] = new CityWeekendCrawlSnapshot
            {
                CityCode = "PRG",
                WeekendStart = weekends[0].DepartureFrom,
                LastCrawledUtc = Now.AddHours(-1),
                LastOfferCount = 20
            },
            [("PRG", weekends[15].DepartureFrom)] = new CityWeekendCrawlSnapshot
            {
                CityCode = "PRG",
                WeekendStart = weekends[15].DepartureFrom,
                LastCrawledUtc = Now.AddDays(-20),
                LastOfferCount = 3
            }
        };

        for (var i = 1; i < weekends.Count; i++)
        {
            if (i == 15)
                continue;

            states[("PRG", weekends[i].DepartureFrom)] = new CityWeekendCrawlSnapshot
            {
                CityCode = "PRG",
                WeekendStart = weekends[i].DepartureFrom,
                LastCrawledUtc = Now.AddHours(-1),
                LastOfferCount = 1
            };
        }

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(5), Now);

        Assert.Contains(plan, item => item.WeekIndex == 15);
        Assert.DoesNotContain(plan, item => item.WeekIndex == 0);
    }

    [Fact]
    public void Plan_NearTermBeatsFarTermOnColdStartEvenForQuieterCity()
    {
        var weekends = WeekendCalendar.GetUpcomingWeekends(30, Now);
        var cities = new[] { "AAA", "BBB" };
        var offerCounts = new Dictionary<string, int>
        {
            ["AAA"] = 0,
            ["BBB"] = 200
        };
        var states = new Dictionary<(string, DateTime), CityWeekendCrawlSnapshot>();

        var plan = CrawlWorkPlanner.Plan(cities, weekends, offerCounts, states, CreateOptions(10), Now);

        Assert.DoesNotContain(plan, item => item.WeekIndex >= 12);
        Assert.Contains(plan, item => item.CityCode == "BBB" && item.WeekIndex == 0);
        Assert.Contains(plan, item => item.CityCode == "AAA" && item.WeekIndex == 0);
    }

    [Fact]
    public void ComputeCityWeight_GrowsWithOffersButStaysPositiveForZero()
    {
        Assert.Equal(1, CrawlWorkPlanner.ComputeCityWeight(0));
        Assert.True(CrawlWorkPlanner.ComputeCityWeight(100) > CrawlWorkPlanner.ComputeCityWeight(10));
    }
}
