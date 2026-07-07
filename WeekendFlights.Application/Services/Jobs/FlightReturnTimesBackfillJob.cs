using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services.Jobs;

public class FlightReturnTimesBackfillJob(
    ITequilaApiSearchClient searchApiClient,
    ICityRepository cityRepository,
    IFlightRepository flightRepository,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<FlightReturnTimesBackfillJob> logger)
{
    public async Task RunAsync(string? cityCodeFilter = null, CancellationToken cancellationToken = default)
    {
        var options = crawlOptions.Value;
        var cityCodes = await flightRepository.GetOriginCityCodesMissingReturnTimesAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(cityCodeFilter))
        {
            cityCodes = cityCodes
                .Where(code => string.Equals(code, cityCodeFilter, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        if (cityCodes.Count == 0)
        {
            logger.LogInformation("No flights missing return times.");
            return;
        }

        var cities = await cityRepository.GetActiveCitiesAsync();
        var citiesByCode = cities.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);
        var weekendDates = WeekendCalendar.GetUpcomingWeekends(options.UpcomingWeeks);

        logger.LogInformation("Backfilling return times for {CityCount} origins", cityCodes.Count);

        foreach (var cityCode in cityCodes)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!citiesByCode.TryGetValue(cityCode, out var city))
            {
                logger.LogWarning("Skipping unknown city code {CityCode}", cityCode);
                continue;
            }

            foreach (var weekend in weekendDates)
            {
                try
                {
                    var parameters = FlightSearchParameters.ForWeekendCrawl(city.Code, weekend);
                    var flights = await searchApiClient.SearchFlightsAsync(parameters, cancellationToken);

                    await flightRepository.UpsertFlightsAsync(flights.ToList());
                    logger.LogInformation(
                        "City {CityCode}: refreshed {Count} flights for {DepartureFrom:yyyy-MM-dd}",
                        city.Code,
                        flights.Count,
                        weekend.DepartureFrom);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error backfilling return times for city {CityCode}", city.Code);
                }

                await Task.Delay(options.RequestDelayMs, cancellationToken);
            }
        }

        logger.LogInformation("Return times backfill completed.");
    }
}
