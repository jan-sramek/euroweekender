using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

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

        var horizonEnd = today.AddDays(options.DayTripUpcomingDays);
        var hubStats = await flightRepository.GetOriginHubStatsAsync(
            today,
            today.AddDays(28),
            cancellationToken);

        var topCityCodes = hubStats
            .OrderByDescending(s => s.OfferCount)
            .Select(s => s.CityCode)
            .Where(code => cities.Any(c => c.Code.Equals(code, StringComparison.OrdinalIgnoreCase)))
            .Take(options.DayTripMaxCities)
            .ToList();

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
            .Where(day => day.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
            .ToList();

        var stateKeyStart = today.AddDays(-7);
        var crawlStates = await crawlStateRepository.GetStatesFromAsync(stateKeyStart, cancellationToken);
        var stateLookup = crawlStates
            .Where(s => s.CityCode.StartsWith(DayTripStatePrefix, StringComparison.Ordinal))
            .ToDictionary(
                s => (s.CityCode, s.WeekendStart),
                s => s.LastCrawledUtc);

        var maxAge = TimeSpan.FromHours(options.DayTripMaxAgeHours);
        var work = new List<(string CityCode, DateTime Day)>();

        foreach (var day in days)
        {
            foreach (var cityCode in topCityCodes)
            {
                var stateCity = DayTripStatePrefix + cityCode;
                if (stateLookup.TryGetValue((stateCity, day), out var lastCrawled)
                    && utcNow - lastCrawled < maxAge)
                {
                    continue;
                }

                work.Add((cityCode, day));
            }
        }

        // Prefer nearer days, then denser hubs (order of topCityCodes).
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
            await flightRepository.UpsertFlightsAsync(flights.ToList());
            logger.LogInformation(
                "Day-trip {CityCode} {Day:yyyy-MM-dd}: imported {Count} flights",
                cityCode, day, flights.Count);
            return flights.Count;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error crawling day-trip {CityCode} {Day:yyyy-MM-dd}", cityCode, day);
            return null;
        }
    }
}
