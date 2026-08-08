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
    private const string PrimaryLocale = "en-US";
    private static readonly TimeSpan CitiesPageDelay = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan AirportsPageDelay = TimeSpan.FromSeconds(1.5);
    private static readonly TimeSpan LocaleDelay = TimeSpan.FromSeconds(2);

    /// <summary>
    /// Tequila locales matching the app UI languages (plus English as the canonical name source).
    /// </summary>
    private static readonly string[] CityNameLocales =
    [
        PrimaryLocale,
        "de-DE",
        "fr-FR",
        "es-ES",
        "it-IT",
        "pl-PL",
        "nl-NL",
        "ro-RO",
        "tr-TR",
        "pt-PT",
        "cs-CZ",
        "hu-HU",
        "el-GR",
        "sv-SE",
        "uk-UA",
        "ru-RU",
        "bg-BG",
        "da-DK",
        "fi-FI",
        "sk-SK",
        "nb-NO",
        "lt-LT",
        "lv-LV",
        "et-EE",
        "is-IS"
    ];

    public async Task<List<City>> LoadCitiesAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        ConfigureApiKey(apiKey);

        var citiesByKiwiId = new Dictionary<string, City>(StringComparer.Ordinal);

        foreach (var locale in CityNameLocales)
        {
            cancellationToken.ThrowIfCancellationRequested();
            logger.LogInformation("Fetching Kiwi city dump for locale {Locale}", locale);

            var pageCities = await LoadCityDumpForLocaleAsync(locale, cancellationToken);
            foreach (var city in pageCities)
            {
                MergeCity(citiesByKiwiId, city, isPrimaryLocale: locale == PrimaryLocale);
            }

            if (locale != CityNameLocales[^1])
                await Task.Delay(LocaleDelay, cancellationToken);
        }

        var cities = citiesByKiwiId.Values
            .Where(c => !string.IsNullOrWhiteSpace(c.Code))
            .OrderBy(c => c.Code, StringComparer.Ordinal)
            .ToList();

        logger.LogInformation(
            "Kiwi city dump finished with {Total} cities ({AliasCount} with search aliases)",
            cities.Count,
            cities.Count(c => c.Aliases.Count > 0));

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
                $"https://api.tequila.kiwi.com/locations/dump?location_types=airport&limit={PageLimit}&sort=rank&locale={PrimaryLocale}&active_only=true";
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

    private async Task<List<City>> LoadCityDumpForLocaleAsync(string locale, CancellationToken cancellationToken)
    {
        var cities = new List<City>();
        string? searchAfter1 = null;
        string? searchAfter2 = null;
        var page = 0;

        while (true)
        {
            page++;
            var url =
                $"https://api.tequila.kiwi.com/locations/dump?location_types=city&limit={PageLimit}&sort=rank&locale={Uri.EscapeDataString(locale)}&active_only=true";
            if (searchAfter1 != null && searchAfter2 != null)
            {
                url += $"&search_after={Uri.EscapeDataString(searchAfter1)}";
                url += $"&search_after={Uri.EscapeDataString(searchAfter2)}";
            }

            using var response = await SendWithRateLimitRetryAsync(url, $"cities:{locale}", page, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            var root = JsonDocument.Parse(json).RootElement;
            var locations = root.GetProperty("locations");
            var pageCount = locations.GetArrayLength();

            if (pageCount == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                cities.Add(MapCity(item));
            }

            logger.LogInformation(
                "Kiwi cities ({Locale}) page {Page}: fetched {PageCount}, locale total {Total}",
                locale, page, pageCount, cities.Count);

            if (!root.TryGetProperty("search_after", out var searchAfter))
                break;

            searchAfter1 = searchAfter[0].GetRawText();
            searchAfter2 = searchAfter[1].GetRawText();

            await Task.Delay(CitiesPageDelay, cancellationToken);
        }

        return cities;
    }

    private static void MergeCity(Dictionary<string, City> citiesByKiwiId, City incoming, bool isPrimaryLocale)
    {
        if (string.IsNullOrWhiteSpace(incoming.KiwiId) || string.IsNullOrWhiteSpace(incoming.Code))
            return;

        if (!citiesByKiwiId.TryGetValue(incoming.KiwiId, out var existing))
        {
            if (!isPrimaryLocale)
            {
                // Prefer English as the canonical display row; skip orphans from other locales.
                return;
            }

            citiesByKiwiId[incoming.KiwiId] = incoming;
            return;
        }

        if (isPrimaryLocale)
        {
            existing.Name = incoming.Name;
            existing.Code = incoming.Code;
            existing.Country = incoming.Country;
            existing.Region = incoming.Region;
            existing.Continent = incoming.Continent;
            existing.Latitude = incoming.Latitude;
            existing.Longitude = incoming.Longitude;
            existing.IsActive = incoming.IsActive;
        }

        AddAlias(existing, incoming.Name);
        foreach (var alias in incoming.Aliases)
            AddAlias(existing, alias);
    }

    private static void AddAlias(City city, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        if (string.Equals(value, city.Name, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, city.Code, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(value, city.Country, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (city.Aliases.Any(existing => string.Equals(existing, value, StringComparison.OrdinalIgnoreCase)))
            return;

        city.Aliases.Add(value);
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
        Aliases = ExtractAlternativeNames(item),
        Airports = []
    };

    private static List<string> ExtractAlternativeNames(JsonElement item)
    {
        if (!item.TryGetProperty("alternative_names", out var altNames) ||
            altNames.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var names = new List<string>();
        foreach (var entry in altNames.EnumerateArray())
        {
            if (entry.ValueKind != JsonValueKind.String)
                continue;

            var value = entry.GetString();
            if (!string.IsNullOrWhiteSpace(value))
                names.Add(value);
        }

        return names;
    }

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
