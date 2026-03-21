using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Crawler.Functions;

public class WeekendFlightCrawler
{
    private const int upcommingWeeks = 12;
    private readonly ITequilaApiSearchClient _searchApiClient;
    private readonly ICityRepository _cityRepository;
    private readonly IFlightRepository _flightRepository;
    private readonly ILogger<WeekendFlightCrawler> _logger;
    private readonly IConfiguration _configuration;

    public WeekendFlightCrawler(
        ITequilaApiSearchClient kiwiApiClient,
        ICityRepository cityRepository,
        IFlightRepository flightRepository,
        ILogger<WeekendFlightCrawler> logger,
        IConfiguration configuration)
    {
        _searchApiClient = kiwiApiClient;
        _cityRepository = cityRepository;
        _flightRepository = flightRepository;
        _logger = logger;
        _configuration = configuration;
    }

    [Function("WeekendFlightCrawler")]
    // public async Task RunAsync([TimerTrigger("0 */6 * * * *")] TimerInfo timerInfo, FunctionContext context)
    public async Task RunAsync([TimerTrigger("*/30 * * * * *")] TimerInfo timerInfo, FunctionContext context)
    {
        _logger.LogInformation("Weekend flight crawler function executed at: {Timestamp}", DateTime.UtcNow);

        try
        {
            var cities = await _cityRepository.GetActiveCitiesAsync();
            var weekendDates = GetUpcomingWeekends(upcommingWeeks);

            foreach (var city in cities)
            {
                foreach (var weekend in weekendDates)
                {
                    await ProcessCityForWeekendAsync(city, weekend);
                    
                    // Add delay to respect API rate limits
                    await Task.Delay(1000);
                }
            }

            _logger.LogInformation("Successfully processed weekend flights for {CityCount} cities", cities.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during weekend flight crawling");
            throw;
        }
    }

    [Function("WeekendFlightCrawlerHttp")]
    public async Task<HttpResponseData> RunHttpAsync(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req,
        FunctionContext context)
    {
        _logger.LogInformation("HTTP weekend flight crawler function executed at: {Timestamp}", DateTime.UtcNow);

        try
        {
            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var request = JsonSerializer.Deserialize<CrawlerRequest>(requestBody);

            if (request?.Cities == null || request.Cities.Count == 0)
            {
                var badResponse = req.CreateResponse(System.Net.HttpStatusCode.BadRequest);
                await badResponse.WriteStringAsync("Cities parameter is required");
                return badResponse;
            }

            var cities = await _cityRepository.GetCitiesByCodesAsync(request.Cities);
            var weekendDates = GetWeekendDatesForRequest(request);

            var results = new List<CrawlerResult>();

            foreach (var city in cities)
            {
                foreach (var weekend in weekendDates)
                {
                    var result = await ProcessCityForWeekendAsync(city, weekend);
                    results.Add(result);
                    
                    await Task.Delay(1000);
                }
            }

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            await response.WriteAsJsonAsync(results);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during HTTP weekend flight crawling");
            var errorResponse = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await errorResponse.WriteStringAsync("Internal server error occurred");
            return errorResponse;
        }
    }

    private List<WeekendDates> GetUpcomingWeekends(int upcomingWeekends)
    {
        var weekends = new List<WeekendDates>();
        var today = DateTime.UtcNow.Date;

        // Get next upcoming weekends
        for (int i = 0; i < upcomingWeekends; i++)
        {
            var currentWeek = today.AddDays(i * 7);
            
            // Calculate days until Thursday and Friday of current week
            int daysUntilThursday = ((int)DayOfWeek.Thursday - (int)currentWeek.DayOfWeek + 7) % 7;
            int daysUntilFriday = ((int)DayOfWeek.Friday - (int)currentWeek.DayOfWeek + 7) % 7;

            var thursday = currentWeek.AddDays(daysUntilThursday);
            var friday = currentWeek.AddDays(daysUntilFriday);
            
            // Calculate Sunday and Monday of the following week (after the weekend)
            var sunday = thursday.AddDays(3); // Thursday + 3 days = Sunday
            var monday = friday.AddDays(3);   // Friday + 3 days = Monday

            // Ensure we're getting future weekends, not current/past ones
            if (i == 0 && thursday <= today)
            {
                // If this is the first iteration and Thursday is today or in the past,
                // skip to the next weekend
                continue;
            }

            weekends.Add(new WeekendDates
            {
                DepartureFrom = thursday,
                DepartureTo = friday,
                ReturnFrom = sunday,
                ReturnTo = monday
            });
        }

        return weekends;
    }

    private List<WeekendDates> GetWeekendDatesForRequest(CrawlerRequest request)
    {
        var weekends = new List<WeekendDates>();

        if (request.WeekendDates != null && request.WeekendDates.Count > 0)
        {
            foreach (var weekend in request.WeekendDates)
            {
                weekends.Add(new WeekendDates
                {
                    DepartureFrom = weekend.DepartureFrom,
                    DepartureTo = weekend.DepartureTo,
                    ReturnFrom = weekend.ReturnFrom,
                    ReturnTo = weekend.ReturnTo
                });
            }
        }
        else
        {
            weekends = GetUpcomingWeekends(upcommingWeeks);
        }

        return weekends;
    }

    private async Task<CrawlerResult> ProcessCityForWeekendAsync(City city, WeekendDates weekend)
    {
        var result = new CrawlerResult
        {
            CityCode = city.Code,
            WeekendStart = weekend.DepartureFrom,
            WeekendEnd = weekend.ReturnTo,
            ProcessedAt = DateTime.UtcNow,
            TripsFound = 0,
            Errors = new List<string>()
        };

        try
        {
            var flights = await _searchApiClient.SearchFlightsAsync(
                city.Code,
                weekend.DepartureFrom,
                weekend.DepartureTo,
                weekend.ReturnFrom,
                weekend.ReturnTo,
                0,
                4,
                20,
                1,
                0,
                0,
                300,
                2,
                "EUR",
                200
                );
        }
        catch (Exception ex)
        {
            var error = $"Error processing city {city.Code}: {ex.Message}";
            _logger.LogError(ex, error);
            result.Errors.Add(error);
        }

        return result;
    }
}

// Supporting DTOs
public class CrawlerRequest
{
    public List<string> Cities { get; set; } = new();
    public List<WeekendDateDto> WeekendDates { get; set; } = new();
}

public class WeekendDateDto
{
    public DateTime DepartureFrom { get; set; }
    public DateTime DepartureTo { get; set; }
    public DateTime ReturnFrom { get; set; }
    public DateTime ReturnTo { get; set; }
}

public class WeekendDates
{
    public DateTime DepartureFrom { get; set; }
    public DateTime DepartureTo { get; set; }
    public DateTime ReturnFrom { get; set; }
    public DateTime ReturnTo { get; set; }
}

public class CrawlerResult
{
    public string CityCode { get; set; } = string.Empty;
    public DateTime WeekendStart { get; set; }
    public DateTime WeekendEnd { get; set; }
    public DateTime ProcessedAt { get; set; }
    public int TripsFound { get; set; }
    public List<string> Errors { get; set; } = new();
}
