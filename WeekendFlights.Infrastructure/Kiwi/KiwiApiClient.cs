using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Kiwi;

public class KiwiApiClient(HttpClient httpClient, ILogger<KiwiApiClient> logger) : IKiwiApiClient
{
    private const int PageLimit = 1000;
    private const int MaxRateLimitRetries = 30;
    private static readonly TimeSpan CitiesPageDelay = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan AirportsPageDelay = TimeSpan.FromSeconds(1.5);

    public async Task<List<City>> LoadCitiesAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        ConfigureApiKey(apiKey);

        var cities = new List<City>();
        var addedCities = new HashSet<string>();
        string? searchAfter1 = null;
        string? searchAfter2 = null;
        var page = 0;

        while (true)
        {
            page++;
            var url =
                $"https://api.tequila.kiwi.com/locations/dump?location_types=city&limit={PageLimit}&sort=rank&locale=en-US&active_only=true";
            if (searchAfter1 != null && searchAfter2 != null)
            {
                url += $"&search_after={Uri.EscapeDataString(searchAfter1)}";
                url += $"&search_after={Uri.EscapeDataString(searchAfter2)}";
            }

            using var response = await SendWithRateLimitRetryAsync(url, "cities", page, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var root = JsonDocument.Parse(json).RootElement;
            var locations = root.GetProperty("locations");
            var pageCount = locations.GetArrayLength();

            if (pageCount == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                var city = MapCity(item);
                if (!addedCities.Contains(city.KiwiId) && !string.IsNullOrWhiteSpace(city.Code))
                {
                    city.IsActive = true;
                    cities.Add(city);
                    addedCities.Add(city.KiwiId);
                }
            }

            logger.LogInformation("Kiwi cities page {Page}: fetched {PageCount}, total {Total}", page, pageCount, cities.Count);

            if (!root.TryGetProperty("search_after", out var searchAfter))
                break;

            searchAfter1 = searchAfter[0].GetRawText();
            searchAfter2 = searchAfter[1].GetRawText();

            await Task.Delay(CitiesPageDelay, cancellationToken);
        }

        logger.LogInformation("Kiwi city dump finished with {Total} cities", cities.Count);
        return cities;
    }

    public async Task<AirportImportData> LoadAirportsAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        ConfigureApiKey(apiKey);

        var airports = new List<Airport>();
        var supplementalCities = new Dictionary<string, City>(StringComparer.Ordinal);
        string? searchAfter1 = null;
        string? searchAfter2 = null;
        var page = 0;

        while (true)
        {
            page++;
            var url =
                $"https://api.tequila.kiwi.com/locations/dump?location_types=airport&limit={PageLimit}&sort=rank&locale=en-US&active_only=true";
            if (searchAfter1 != null && searchAfter2 != null)
            {
                url += $"&search_after={Uri.EscapeDataString(searchAfter1)}";
                url += $"&search_after={Uri.EscapeDataString(searchAfter2)}";
            }

            using var response = await SendWithRateLimitRetryAsync(url, "airports", page, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var root = JsonDocument.Parse(json).RootElement;
            var locations = root.GetProperty("locations");
            var pageCount = locations.GetArrayLength();

            if (pageCount == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                var airport = MapAirport(item);
                airports.Add(airport);

                if (item.TryGetProperty("city", out var cityElement) &&
                    cityElement.ValueKind == JsonValueKind.Object)
                {
                    var city = MapCity(cityElement);
                    if (!string.IsNullOrWhiteSpace(city.KiwiId) && !string.IsNullOrWhiteSpace(city.Code))
                    {
                        supplementalCities.TryAdd(city.KiwiId, city);
                    }
                }
            }

            logger.LogInformation("Kiwi airports page {Page}: fetched {PageCount}, total {Total}", page, pageCount, airports.Count);

            if (!root.TryGetProperty("search_after", out var searchAfter))
                break;

            searchAfter1 = searchAfter[0].GetRawText();
            searchAfter2 = searchAfter[1].GetRawText();

            await Task.Delay(AirportsPageDelay, cancellationToken);
        }

        logger.LogInformation(
            "Kiwi airport dump finished with {AirportTotal} airports and {CityTotal} supplemental cities",
            airports.Count,
            supplementalCities.Count);

        return new AirportImportData
        {
            Airports = airports,
            SupplementalCities = supplementalCities.Values.ToList()
        };
    }

    private void ConfigureApiKey(string apiKey)
    {
        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("apikey", apiKey);
    }

    private async Task<HttpResponseMessage> SendWithRateLimitRetryAsync(
        string url,
        string resource,
        int page,
        CancellationToken cancellationToken)
    {
        for (var attempt = 1; attempt <= MaxRateLimitRetries; attempt++)
        {
            var response = await httpClient.GetAsync(url, cancellationToken);
            if (response.StatusCode != HttpStatusCode.TooManyRequests)
                return response;

            var delaySeconds = Math.Min(60, (int)Math.Pow(2, attempt));
            logger.LogWarning(
                "Kiwi API rate limited ({Resource} page {Page}), retry {Attempt}/{MaxAttempts} in {DelaySeconds}s",
                resource, page, attempt, MaxRateLimitRetries, delaySeconds);

            response.Dispose();
            await Task.Delay(TimeSpan.FromSeconds(delaySeconds), cancellationToken);
        }

        throw new HttpRequestException(
            $"Kiwi API rate limit exceeded for {resource} page {page} after {MaxRateLimitRetries} retries.");
    }

    private static City MapCity(JsonElement item) => new()
    {
        KiwiId = item.GetProperty("id").GetString()!,
        Name = item.GetProperty("name").GetString()!,
        Code = item.GetProperty("code").GetString()!,
        Country = item.GetProperty("country").GetProperty("name").GetString()!,
        Region = item.TryGetProperty("region", out var region) && region.ValueKind == JsonValueKind.Object
            ? region.GetProperty("name").GetString()
            : null,
        Continent = item.GetProperty("continent").GetProperty("name").GetString()!,
        Latitude = item.GetProperty("location").GetProperty("lat").GetDecimal(),
        Longitude = item.GetProperty("location").GetProperty("lon").GetDecimal(),
        IsActive = true,
        Airports = []
    };

    private static Airport MapAirport(JsonElement item) => new()
    {
        KiwiId = item.TryGetProperty("int_id", out var intIdProp) && intIdProp.ValueKind == JsonValueKind.Number
            ? intIdProp.GetInt32()
            : 0,
        IataCode = item.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == JsonValueKind.String
            ? codeProp.GetString()!
            : string.Empty,
        IcaoCode = item.TryGetProperty("icao", out var icaoProp) && icaoProp.ValueKind == JsonValueKind.String
            ? icaoProp.GetString()!
            : string.Empty,
        Name = item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String
            ? nameProp.GetString()!
            : string.Empty,
        TimeZone = item.TryGetProperty("timezone", out var tzProp) && tzProp.ValueKind == JsonValueKind.String
            ? tzProp.GetString()!
            : string.Empty,
        Latitude = item.TryGetProperty("location", out var locProp) &&
                   locProp.TryGetProperty("lat", out var latProp) &&
                   latProp.ValueKind == JsonValueKind.Number
            ? latProp.GetDouble()
            : 0,
        Longitude = item.TryGetProperty("location", out var locPropAgain) &&
                    locPropAgain.TryGetProperty("lon", out var lonProp) &&
                    lonProp.ValueKind == JsonValueKind.Number
            ? lonProp.GetDouble()
            : 0,
        Rank = item.TryGetProperty("rank", out var rankProp) && rankProp.ValueKind == JsonValueKind.Number
            ? rankProp.GetInt32()
            : 0,
        GlobalRankDestination = item.TryGetProperty("global_rank_dst", out var globalRankProp) &&
                                globalRankProp.ValueKind == JsonValueKind.Number
            ? globalRankProp.GetInt32()
            : 0,
        DestinationPopularityScore = item.TryGetProperty("dst_popularity_score", out var popScoreProp) &&
                                     popScoreProp.ValueKind == JsonValueKind.Number
            ? popScoreProp.GetDouble()
            : 0,
        CityKiwiId = item.TryGetProperty("city", out var cityProp) &&
                     cityProp.ValueKind == JsonValueKind.Object &&
                     cityProp.TryGetProperty("id", out var cityIdProp) &&
                     cityIdProp.ValueKind == JsonValueKind.String
            ? cityIdProp.GetString()!
            : string.Empty,
        IsActive = true
    };
}
