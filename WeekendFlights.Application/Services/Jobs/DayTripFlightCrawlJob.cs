using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services.Jobs;

/// <summary>
/// Crawls same-day return trips (out in the morning, back in the evening).
/// </summary>
public class DayTripFlightCrawlJob(
    ITequilaApiSearchClient searchApiClient,
    ICityRepository cityRepository,
    IFlightRepository flightRepository,
    ICityWeekendCrawlStateRepository crawlStateRepository,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<DayTripFlightCrawlJob> logger)
{
    private static readonly string DayTripStatePrefix = "D:";

    /// <summary>Always rotate these origins first — default user airports and strong EU hubs.</summary>
    private static readonly string[] PriorityOriginCodes =
    [
        "PRG", "OSR", "KTW", "VIE", "BUD", "KRK", "WAW", "BER", "MUC", "FRA",
        "AMS", "BRU", "CPH", "ARN", "HEL", "OSL", "MIL", "MXP", "FCO", "BCN",
        "MAD", "LIS", "DUB", "LTN", "STN", "MAN", "EDI"
    ];

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var options = crawlOptions.Value;
        var utcNow = DateTime.UtcNow;
        var today = DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc);

        logger.LogInformation(
            "Day-trip crawl started (horizon: {Days} days, budget: {MaxSearches}, cities: {MaxCities})",
            options.DayTripUpcomingDays,
            options.DayTripMaxSearchesPerRun,
            options.DayTripMaxCities);

        var cities = await cityRepository.GetActiveCitiesAsync();
        if (cities.Count == 0)
        {
            logger.LogWarning("No active cities for day-trip crawl");
            return;
        }

        var citySet = cities.Select(c => c.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var hubStats = await flightRepository.GetOriginHubStatsAsync(
            today,
            today.AddDays(28),
            cancellationToken);

        var topCityCodes = new List<string>();
        foreach (var code in PriorityOriginCodes)
        {
            if (citySet.Contains(code) && !topCityCodes.Contains(code, StringComparer.OrdinalIgnoreCase))
                topCityCodes.Add(code.ToUpperInvariant());
        }

        foreach (var code in hubStats
                     .OrderByDescending(s => s.OfferCount)
                     .Select(s => s.CityCode))
        {
            if (topCityCodes.Count >= options.DayTripMaxCities)
                break;
            if (citySet.Contains(code) && !topCityCodes.Contains(code, StringComparer.OrdinalIgnoreCase))
                topCityCodes.Add(code.ToUpperInvariant());
        }

        if (topCityCodes.Count == 0)
        {
            topCityCodes = cities
                .OrderBy(c => c.Code)
                .Take(options.DayTripMaxCities)
                .Select(c => c.Code)
                .ToList();
        }

        var days = Enumerable.Range(0, options.DayTripUpcomingDays)
            .Select(offset => today.AddDays(offset))
            .ToList();

        var stateKeyStart = today.AddDays(-7);
        var crawlStates = await crawlStateRepository.GetStatesFromAsync(stateKeyStart, cancellationToken);
        var stateLookup = crawlStates
            .Where(s => s.CityCode.StartsWith(DayTripStatePrefix, StringComparison.Ordinal))
            .ToDictionary(
                s => (s.CityCode, s.WeekendStart),
                s => (s.LastCrawledUtc, s.LastOfferCount));

        var freshMaxAge = TimeSpan.FromHours(options.DayTripMaxAgeHours);
        var emptyMaxAge = TimeSpan.FromHours(Math.Max(2, options.DayTripMaxAgeHours / 8));
        var work = new List<(string CityCode, DateTime Day)>();

        foreach (var day in days)
        {
            foreach (var cityCode in topCityCodes)
            {
                var stateCity = DayTripStatePrefix + cityCode;
                if (stateLookup.TryGetValue((stateCity, day), out var state))
                {
                    var maxAge = state.LastOfferCount <= 0 ? emptyMaxAge : freshMaxAge;
                    if (utcNow - state.LastCrawledUtc < maxAge)
                        continue;
                }

                work.Add((cityCode, day));
            }
        }

        work = work
            .OrderBy(item => item.Day)
            .ThenBy(item => topCityCodes.IndexOf(item.CityCode))
            .Take(options.DayTripMaxSearchesPerRun)
            .ToList();

        logger.LogInformation("Planned {WorkCount} day-trip searches", work.Count);

        var searchesCompleted = 0;
        foreach (var (cityCode, day) in work)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var offerCount = await ProcessDayTripAsync(cityCode, day, cancellationToken);
            if (offerCount is int count)
            {
                await crawlStateRepository.UpsertAsync(
                    DayTripStatePrefix + cityCode,
                    day,
                    DateTime.UtcNow,
                    count,
                    cancellationToken);
            }

            searchesCompleted++;
            if (searchesCompleted < work.Count)
                await Task.Delay(options.RequestDelayMs, cancellationToken);
        }

        logger.LogInformation("Day-trip crawl finished: {SearchCount} searches", searchesCompleted);
    }

    private async Task<int?> ProcessDayTripAsync(
        string cityCode,
        DateTime day,
        CancellationToken cancellationToken)
    {
        try
        {
            var parameters = FlightSearchParameters.ForDayTripCrawl(cityCode, day);
            var flights = await searchApiClient.SearchFlightsAsync(parameters, cancellationToken);
            var matches = flights.Where(DayTripFlightFilter.Matches).ToList();
            if (matches.Count > 0)
                await flightRepository.UpsertFlightsAsync(matches);

            logger.LogInformation(
                "Day-trip {CityCode} {Day:yyyy-MM-dd}: kiwi={KiwiCount}, kept={Kept}",
                cityCode, day, flights.Count, matches.Count);
            return matches.Count;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error crawling day-trip {CityCode} {Day:yyyy-MM-dd}", cityCode, day);
            return null;
        }
    }
}
