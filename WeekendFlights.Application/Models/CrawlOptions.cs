namespace WeekendFlights.Application.Models;

public sealed class CrawlOptions
{
    public const string SectionName = "Crawl";

    /// <summary>How many upcoming weekends to cover (~52 ≈ 12 months).</summary>
    public int UpcomingWeeks { get; init; } = 52;

    /// <summary>Max Kiwi searches executed in a single crawl run.</summary>
    public int MaxSearchesPerRun { get; init; } = 100;

    /// <summary>Delay between consecutive search requests.</summary>
    public int RequestDelayMs { get; init; } = 2000;

    /// <summary>Background service interval between crawl runs.</summary>
    public int IntervalMinutes { get; init; } = 10;

    /// <summary>Week indexes below this use near-term freshness.</summary>
    public int NearTermWeeks { get; init; } = 4;

    /// <summary>Week indexes below this (and &gt;= NearTermWeeks) use mid-term freshness.</summary>
    public int MidTermWeeks { get; init; } = 12;

    /// <summary>Week indexes below this (and &gt;= MidTermWeeks) use far-term freshness; rest use distant.</summary>
    public int FarTermWeeks { get; init; } = 26;

    public int NearTermMaxAgeHours { get; init; } = 12;
    public int MidTermMaxAgeHours { get; init; } = 72;
    public int FarTermMaxAgeHours { get; init; } = 168;
    public int DistantTermMaxAgeHours { get; init; } = 336;

    public TimeSpan GetMaxAge(int weekIndex)
    {
        if (weekIndex < NearTermWeeks)
            return TimeSpan.FromHours(NearTermMaxAgeHours);

        if (weekIndex < MidTermWeeks)
            return TimeSpan.FromHours(MidTermMaxAgeHours);

        if (weekIndex < FarTermWeeks)
            return TimeSpan.FromHours(FarTermMaxAgeHours);

        return TimeSpan.FromHours(DistantTermMaxAgeHours);
    }
}
