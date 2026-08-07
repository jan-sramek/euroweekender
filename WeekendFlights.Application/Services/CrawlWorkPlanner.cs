using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public static class CrawlWorkPlanner
{
    /// <summary>
    /// Large synthetic overdue used for never-crawled pairs so they fill the horizon first.
    /// </summary>
    public const double NeverCrawledOverdueHours = 10_000;

    public static IReadOnlyList<CrawlWorkItem> Plan(
        IReadOnlyList<string> cityCodes,
        IReadOnlyList<WeekendDates> weekends,
        IReadOnlyDictionary<string, int> offerCountsByCity,
        IReadOnlyDictionary<(string CityCode, DateTime WeekendStart), CityWeekendCrawlSnapshot> crawlStates,
        CrawlOptions options,
        DateTime utcNow)
    {
        if (cityCodes.Count == 0 || weekends.Count == 0 || options.MaxSearchesPerRun <= 0)
            return [];

        var due = new List<CrawlWorkItem>();

        for (var weekIndex = 0; weekIndex < weekends.Count; weekIndex++)
        {
            var weekend = weekends[weekIndex];
            var maxAge = options.GetMaxAge(weekIndex);

            foreach (var cityCode in cityCodes)
            {
                crawlStates.TryGetValue((cityCode, weekend.DepartureFrom), out var state);
                var hoursOverdue = ComputeHoursOverdue(state, maxAge, utcNow);
                if (hoursOverdue is null)
                    continue;

                offerCountsByCity.TryGetValue(cityCode, out var offerCount);
                var cityWeight = ComputeCityWeight(offerCount);
                var weekFactor = 1.0 / (1.0 + weekIndex);
                var score = cityWeight * (hoursOverdue.Value + 1) * weekFactor;

                due.Add(new CrawlWorkItem
                {
                    CityCode = cityCode,
                    Weekend = weekend,
                    WeekIndex = weekIndex,
                    Score = score
                });
            }
        }

        return due
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.WeekIndex)
            .ThenBy(item => item.CityCode, StringComparer.Ordinal)
            .Take(options.MaxSearchesPerRun)
            .ToList();
    }

    public static double ComputeCityWeight(int offerCount)
        => 1 + Math.Log(1 + Math.Max(offerCount, 0));

    private static double? ComputeHoursOverdue(
        CityWeekendCrawlSnapshot? state,
        TimeSpan maxAge,
        DateTime utcNow)
    {
        if (state is null)
            return NeverCrawledOverdueHours;

        var age = utcNow - state.LastCrawledUtc;
        if (age < maxAge)
            return null;

        return (age - maxAge).TotalHours;
    }
}
