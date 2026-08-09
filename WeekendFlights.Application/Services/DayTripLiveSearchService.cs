using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Services;

public interface IDayTripLiveSearchService
{
    /// <summary>
    /// Live-search Kiwi for morning-out / evening-back same-day trips, upsert matches, return DB rows.
    /// Hard-capped Kiwi call budget per request.
    /// </summary>
    Task<IReadOnlyList<FlightListItem>> SearchAndStoreAsync(
        IReadOnlyList<string> cityCodes,
        IReadOnlyList<DateTime> days,
        CancellationToken cancellationToken = default);
}

public sealed class DayTripLiveSearchService(
    ITequilaApiSearchClient searchApiClient,
    IFlightRepository flightRepository,
    IOptions<CrawlOptions> crawlOptions,
    ILogger<DayTripLiveSearchService> logger) : IDayTripLiveSearchService
{
    public const int MaxCitiesPerRequest = 3;
    public const int MaxDaysPerRequest = 8;
    public const int MaxKiwiCallsPerRequest = 12;

    public async Task<IReadOnlyList<FlightListItem>> SearchAndStoreAsync(
        IReadOnlyList<string> cityCodes,
        IReadOnlyList<DateTime> days,
        CancellationToken cancellationToken = default)
    {
        var cities = cityCodes
            .Select(c => c.Trim().ToUpperInvariant())
            .Where(c => c.Length > 0)
            .Distinct()
            .Take(MaxCitiesPerRequest)
            .ToList();

        var uniqueDays = days
            .Select(d => DateTime.SpecifyKind(d.Date, DateTimeKind.Utc))
            .Distinct()
            .OrderBy(d => d)
            .Take(MaxDaysPerRequest)
            .ToList();

        if (cities.Count == 0 || uniqueDays.Count == 0)
            return [];

        var delayMs = Math.Max(250, crawlOptions.Value.RequestDelayMs / 4);
        var calls = 0;

        foreach (var day in uniqueDays)
        {
            foreach (var city in cities)
            {
                if (calls >= MaxKiwiCallsPerRequest)
                    break;

                cancellationToken.ThrowIfCancellationRequested();
                calls++;

                try
                {
                    var parameters = FlightSearchParameters.ForDayTripCrawl(city, day);
                    var flights = await searchApiClient.SearchFlightsAsync(parameters, cancellationToken);
                    var matches = flights.Where(DayTripFlightFilter.Matches).ToList();
                    if (matches.Count > 0)
                        await flightRepository.UpsertFlightsAsync(matches);

                    logger.LogInformation(
                        "Live day-trip {City} {Day:yyyy-MM-dd}: kiwi={KiwiCount}, kept={Kept}",
                        city, day, flights.Count, matches.Count);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogError(ex, "Live day-trip search failed for {City} {Day:yyyy-MM-dd}", city, day);
                }

                if (calls < MaxKiwiCallsPerRequest)
                    await Task.Delay(delayMs, cancellationToken);
            }

            if (calls >= MaxKiwiCallsPerRequest)
                break;
        }

        var departFrom = uniqueDays[0];
        var departTo = uniqueDays[^1].AddDays(1).AddTicks(-1);

        var (items, _) = await flightRepository.GetFlightsAsync(
            string.Join(',', cities),
            cityCodeTo: null,
            departFromUtc: departFrom,
            departToUtc: departTo,
            skip: 0,
            take: 500,
            includeTotal: false,
            nightsInDest: 0,
            cancellationToken);

        return items.Where(f =>
        {
            if (f.LocalReturnDeparture is not DateTime ret)
                return false;
            if (f.LocalDeparture.Date != ret.Date)
                return false;
            var outMinutes = f.LocalDeparture.Hour * 60 + f.LocalDeparture.Minute;
            if (outMinutes < DayTripFlightFilter.MorningFromHour * 60
                || outMinutes >= DayTripFlightFilter.MorningToHour * 60)
            {
                return false;
            }

            var backMinutes = ret.Hour * 60 + ret.Minute;
            return backMinutes >= DayTripFlightFilter.EveningFromHour * 60;
        }).ToList();
    }
}
