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
    IOptions<CrawlOptions> crawlOptions,
    ILogger<WeekendFlightCrawlJob> logger)
{
    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        var options = crawlOptions.Value;
        logger.LogInformation("Weekend flight crawl started at: {Timestamp}", DateTime.UtcNow);

        var cities = await cityRepository.GetActiveCitiesAsync();
        var weekendDates = WeekendCalendar.GetUpcomingWeekends(options.UpcomingWeeks);

        var lastImport = await flightsImportRepository.GetLatestImportAsync();
        var startFromCity = true;
        var processedCities = new List<string>();
        var citiesProcessed = 0;

        if (lastImport != null
            && !string.IsNullOrEmpty(lastImport.LastCityCode)
            && lastImport.LastCityCode != cities.Last().Code
            && cities.Any(x => x.Code == lastImport.LastCityCode))
        {
            logger.LogInformation("Resuming from city after: {LastCityCode}", lastImport.LastCityCode);
            startFromCity = false;
        }

        foreach (var city in cities)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (citiesProcessed >= options.MaxCitiesPerRun)
            {
                logger.LogInformation("Reached maximum cities per run limit: {MaxCities}", options.MaxCitiesPerRun);
                break;
            }

            if (!startFromCity)
            {
                if (city.Code == lastImport?.LastCityCode)
                {
                    startFromCity = true;
                    continue;
                }

                continue;
            }

            foreach (var weekend in weekendDates)
            {
                await ProcessCityForWeekendAsync(city, weekend, cancellationToken);
                await Task.Delay(options.RequestDelayMs, cancellationToken);
            }

            processedCities.Add(city.Code);
            citiesProcessed++;
        }

        var lastCity = processedCities.LastOrDefault() ?? cities.LastOrDefault()?.Code ?? string.Empty;
        if (!string.IsNullOrEmpty(lastCity))
        {
            var completedFullCycle = processedCities.Count == cities.Count
                && lastImport != null
                && lastImport.LastCityCode == lastCity;

            if (completedFullCycle)
            {
                logger.LogInformation("Completed full cycle through all cities, resetting to start from beginning next time");
                lastCity = string.Empty;
            }

            await flightsImportRepository.AddAsync(new FlightsImport
            {
                DateTimeUtc = DateTime.UtcNow,
                LastCityCode = lastCity
            });
        }

        logger.LogInformation(
            "Successfully processed weekend flights for {ProcessedCount} cities (out of {TotalCount} total cities, max per run: {MaxCities})",
            processedCities.Count, cities.Count, options.MaxCitiesPerRun);
    }

    private async Task ProcessCityForWeekendAsync(City city, WeekendDates weekend, CancellationToken cancellationToken)
    {
        try
        {
            var parameters = FlightSearchParameters.ForWeekendCrawl(city.Code, weekend);
            var flights = await searchApiClient.SearchFlightsAsync(parameters, cancellationToken);

            await flightRepository.UpsertFlightsAsync(flights.ToList());
            logger.LogInformation("City {CityCode}: imported {Count} flights", city.Code, flights.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing city {CityCode}", city.Code);
        }
    }
}
