using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Services;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/cities")]
public class CitiesController(
    ICityRepository cityRepository,
    IHubScoreService hubScoreService,
    ITequilaLocationClient tequilaLocationClient,
    IMemoryCache memoryCache) : ControllerBase
{
    private static readonly TimeSpan HubScoresCacheDuration = TimeSpan.FromMinutes(5);

    [HttpGet("hub-scores")]
    [ProducesResponseType(typeof(IReadOnlyList<OriginHubScoreDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OriginHubScoreDto>>> GetHubScoresAsync(
        [FromQuery] int weeks = WeekendHubIndex.DefaultWeeksAhead,
        CancellationToken cancellationToken = default)
    {
        weeks = Math.Clamp(weeks, 1, 12);
        Response.Headers.CacheControl = "public, max-age=300";

        var cacheKey = $"cities:hub-scores:{weeks}";
        if (!memoryCache.TryGetValue(cacheKey, out IReadOnlyList<OriginHubScoreDto>? dtos) || dtos is null)
        {
            var scores = await hubScoreService.GetHubScoresAsync(weeks, cancellationToken);
            dtos = scores
                .Select(score => new OriginHubScoreDto(
                    score.Code,
                    score.OfferCount,
                    score.MinPrice,
                    score.AverageQuality,
                    score.DestinationCount,
                    score.HubScore))
                .ToList();

            memoryCache.Set(cacheKey, dtos, HubScoresCacheDuration);
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Top destinations from an origin city by cheap-offer count in the upcoming weeks.
    /// </summary>
    [HttpGet("{code}/top-destinations")]
    [ProducesResponseType(typeof(IReadOnlyList<OriginDestinationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OriginDestinationDto>>> GetTopDestinationsAsync(
        string code,
        [FromQuery] int weeks = WeekendHubIndex.DefaultWeeksAhead,
        [FromQuery] int limit = 30,
        CancellationToken cancellationToken = default)
    {
        weeks = Math.Clamp(weeks, 1, 12);
        limit = Math.Clamp(limit, 1, 50);
        Response.Headers.CacheControl = "public, max-age=300";

        var cacheKey = $"cities:top-destinations:v2:{code.Trim().ToUpperInvariant()}:{weeks}:{limit}";
        if (!memoryCache.TryGetValue(cacheKey, out IReadOnlyList<OriginDestinationDto>? dtos) || dtos is null)
        {
            var destinations = await hubScoreService.GetTopDestinationsAsync(
                code,
                weeks,
                limit,
                cancellationToken);
            dtos = destinations
                .Select(d => new OriginDestinationDto(d.CityCodeTo, d.OfferCount, d.MinPrice, d.CheapOfferCount))
                .ToList();
            memoryCache.Set(cacheKey, dtos, HubScoresCacheDuration);
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Multilingual city typeahead via Tequila locations/query, mapped to our cities.
    /// </summary>
    [HttpGet("suggest")]
    [ProducesResponseType(typeof(IReadOnlyList<CitySuggestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CitySuggestDto>>> SuggestAsync(
        [FromQuery] string term,
        [FromQuery] string? locale = null,
        [FromQuery] int limit = 8,
        CancellationToken cancellationToken = default)
    {
        var query = term?.Trim() ?? string.Empty;
        if (query.Length < 1)
            return Ok(Array.Empty<CitySuggestDto>());

        var cappedLimit = Math.Clamp(limit, 1, 15);
        var tequilaLocale = TequilaLocaleMapper.ToTequilaLocale(locale);
        var suggestions = await tequilaLocationClient.SuggestCitiesAsync(
            query,
            tequilaLocale,
            cappedLimit,
            cancellationToken);

        if (suggestions.Count == 0)
            return Ok(Array.Empty<CitySuggestDto>());

        var codes = suggestions
            .Select(s => s.Code)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var cities = await cityRepository.GetCitiesByCodesAsync(codes);
        var cityByCode = cities.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);

        var dtos = new List<CitySuggestDto>();
        foreach (var suggestion in suggestions)
        {
            if (!cityByCode.TryGetValue(suggestion.Code, out var city))
                continue;

            var namesByLocale = CopyNamesByLocale(city);
            if (!string.IsNullOrWhiteSpace(suggestion.Name))
                namesByLocale[tequilaLocale] = suggestion.Name.Trim();

            dtos.Add(new CitySuggestDto(
                city.Id,
                city.Code,
                city.Name,
                city.Country,
                city.Region,
                city.Continent,
                city.Latitude,
                city.Longitude,
                city.IsActive,
                city.Aliases,
                namesByLocale,
                suggestion.Name));
        }

        var learned = dtos
            .Where(d => !string.IsNullOrWhiteSpace(d.LocalizedName))
            .GroupBy(d => d.Code, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First().LocalizedName, StringComparer.OrdinalIgnoreCase);
        if (learned.Count > 0)
        {
            await cityRepository.MergeLocalizedNamesAsync(learned, tequilaLocale, cancellationToken);
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Localized display names for the given IATA codes (from stored Kiwi names, else Tequila).
    /// </summary>
    [HttpGet("localized-names")]
    [ProducesResponseType(typeof(IReadOnlyDictionary<string, string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyDictionary<string, string>>> GetLocalizedNamesAsync(
        [FromQuery] string? locale = null,
        [FromQuery] string? codes = null,
        CancellationToken cancellationToken = default)
    {
        var tequilaLocale = TequilaLocaleMapper.ToTequilaLocale(locale);
        var requested = (codes ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(code => code.ToUpperInvariant())
            .Where(code => code.Length > 0)
            .Distinct()
            .Take(80)
            .ToList();

        if (requested.Count == 0)
            return Ok(new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase));

        var cities = await cityRepository.GetCitiesByCodesAsync(requested);
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var missing = new List<string>();

        foreach (var city in cities)
        {
            if (TryLocalizedName(city, tequilaLocale, out var stored))
                result[city.Code] = stored;
            else
                missing.Add(city.Code);
        }

        if (missing.Count > 0)
        {
            var fetched = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            using var gate = new SemaphoreSlim(6);
            await Task.WhenAll(missing.Select(async code =>
            {
                await gate.WaitAsync(cancellationToken);
                try
                {
                    var suggestions = await tequilaLocationClient.SuggestCitiesAsync(
                        code,
                        tequilaLocale,
                        5,
                        cancellationToken);
                    var match = suggestions.FirstOrDefault(item =>
                                   item.Code.Equals(code, StringComparison.OrdinalIgnoreCase))
                               ?? suggestions.FirstOrDefault();
                    var name = match?.Name?.Trim();
                    if (string.IsNullOrWhiteSpace(name))
                        return;

                    lock (fetched)
                    {
                        fetched[code] = name;
                    }
                }
                finally
                {
                    gate.Release();
                }
            }));

            foreach (var pair in fetched)
                result[pair.Key] = pair.Value;

            if (fetched.Count > 0)
            {
                await cityRepository.MergeLocalizedNamesAsync(fetched, tequilaLocale, cancellationToken);
            }
        }

        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CityDto>>> GetAsync(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "public, max-age=3600";

        var list = activeOnly
            ? await cityRepository.GetActiveCitiesAsync()
            : await cityRepository.GetAllCitiesAsync();

        var dtos = list.Select(ToCityDto).ToList();

        return Ok(dtos);
    }

    [HttpGet("{code}")]
    [ProducesResponseType(typeof(CityDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CityDto>> GetByCodeAsync(
        string code,
        CancellationToken cancellationToken = default)
    {
        var city = await cityRepository.GetCityByCodeAsync(code);
        if (city is null)
            return NotFound();

        return Ok(ToCityDto(city));
    }

    private static bool TryLocalizedName(City city, string tequilaLocale, out string name)
    {
        name = string.Empty;
        var names = city.NamesByLocale;
        if (names is null || names.Count == 0)
            return false;

        if (names.TryGetValue(tequilaLocale, out var exact) && !string.IsNullOrWhiteSpace(exact))
        {
            name = exact.Trim();
            return true;
        }

        var prefix = tequilaLocale.Split('-', 2)[0] + "-";
        foreach (var (locale, value) in names)
        {
            if (locale.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrWhiteSpace(value))
            {
                name = value.Trim();
                return true;
            }
        }

        return false;
    }

    private static CityDto ToCityDto(City city) => new(
        city.Id,
        city.Code,
        city.Name,
        city.Country,
        city.Region,
        city.Continent,
        city.Latitude,
        city.Longitude,
        city.IsActive,
        city.Aliases,
        CopyNamesByLocale(city));

    private static Dictionary<string, string> CopyNamesByLocale(City city)
    {
        var names = city.NamesByLocale;
        if (names is null || names.Count == 0)
            return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        return new Dictionary<string, string>(names, StringComparer.OrdinalIgnoreCase);
    }
}
