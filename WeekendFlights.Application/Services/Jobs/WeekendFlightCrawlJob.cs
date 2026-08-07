using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Services.Jobs;

public class WeekendFlightCrawlJob(
    ITequilaApiSearchClient searchApiClient,
    ICityRepository cityRepository,
    IFlightRepository flightRepository,
    IFlightsImportRepository flightsImportRepository,
    ICityWeekendCrawlStateRepository crawlStateRepository,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<WeekendFlightCrawlJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var options = crawlOptions.Value;
        var utcNow = DateTime.UtcNow;
        logger.LogInformation(
            "Weekend flight crawl started at: {Timestamp} (horizon: {UpcomingWeeks} weeks, budget: {MaxSearches})",
            utcNow, options.UpcomingWeeks, options.MaxSearchesPerRun);

        var cities = await cityRepository.GetActiveCitiesAsync();
        if (cities.Count == 0)
        {
            logger.LogWarning("No active cities to crawl");
            return;
        }

        var weekends = WeekendCalendar.GetUpcomingWeekends(options.UpcomingWeeks, utcNow);
        if (weekends.Count == 0)
        {
            logger.LogWarning("No upcoming weekends to crawl");
            return;
        }

        var horizonStart = weekends[0].DepartureFrom;
        var crawlStates = await crawlStateRepository.GetStatesFromAsync(horizonStart, cancellationToken);
        var stateLookup = crawlStates.ToDictionary(
            s => (s.CityCode, s.WeekendStart),
            s => new CityWeekendCrawlSnapshot
            {
                CityCode = s.CityCode,
                WeekendStart = s.WeekendStart,
                LastCrawledUtc = s.LastCrawledUtc,
                LastOfferCount = s.LastOfferCount
            });

        var nearTermEnd = DateTime.SpecifyKind(
            utcNow.Date.AddDays(options.NearTermWeeks * 7),
            DateTimeKind.Utc);
        var hubStats = await flightRepository.GetOriginHubStatsAsync(
            DateTime.SpecifyKind(utcNow.Date, DateTimeKind.Utc),
            nearTermEnd,
            cancellationToken);
        var offerCounts = hubStats.ToDictionary(s => s.CityCode, s => s.OfferCount, StringComparer.Ordinal);

        var work = CrawlWorkPlanner.Plan(
            cities.Select(c => c.Code).ToList(),
            weekends,
            offerCounts,
            stateLookup,
            options,
            utcNow);

        logger.LogInformation("Planned {WorkCount} due searches out of {CandidateCapacity} budget",
            work.Count, options.MaxSearchesPerRun);

        var processedCities = new HashSet<string>(StringComparer.Ordinal);
        var searchesCompleted = 0;

        foreach (var item in work)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var offerCount = await ProcessCityForWeekendAsync(item.CityCode, item.Weekend, cancellationToken);
            await crawlStateRepository.UpsertAsync(
                item.CityCode,
                item.Weekend.DepartureFrom,
                DateTime.UtcNow,
                offerCount,
                cancellationToken);

            processedCities.Add(item.CityCode);
            searchesCompleted++;

            if (searchesCompleted < work.Count)
                await Task.Delay(options.RequestDelayMs, cancellationToken);
        }

        var lastCity = work.LastOrDefault()?.CityCode ?? string.Empty;
        await flightsImportRepository.AddAsync(new FlightsImport
        {
            DateTimeUtc = DateTime.UtcNow,
            LastCityCode = lastCity
        });

        var pruned = await crawlStateRepository.DeleteBeforeAsync(horizonStart, cancellationToken);
        if (pruned > 0)
            logger.LogInformation("Pruned {PrunedCount} past city-weekend crawl states", pruned);

        logger.LogInformation(
            "Crawl finished: {SearchCount} searches across {CityCount} cities (active cities: {TotalCities})",
            searchesCompleted, processedCities.Count, cities.Count);
    }

    private async Task<int> ProcessCityForWeekendAsync(
        string cityCode,
        WeekendDates weekend,
        CancellationToken cancellationToken)
    {
        try
        {
            var parameters = FlightSearchParameters.ForWeekendCrawl(cityCode, weekend);
            var flights = await searchApiClient.SearchFlightsAsync(parameters, cancellationToken);

            await flightRepository.UpsertFlightsAsync(flights.ToList());
            logger.LogInformation(
                "City {CityCode} weekend {WeekendStart:yyyy-MM-dd}: imported {Count} flights",
                cityCode, weekend.DepartureFrom, flights.Count);
            return flights.Count;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing city {CityCode} for weekend {WeekendStart:yyyy-MM-dd}",
                cityCode, weekend.DepartureFrom);
            return 0;
        }
    }
}
