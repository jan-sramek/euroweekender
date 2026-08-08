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

        return Ok(dtos);
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

    private static Dictionary<string, string> CopyNamesByLocale(City city) =>
        city.NamesByLocale.Count == 0
            ? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            : new Dictionary<string, string>(city.NamesByLocale, StringComparer.OrdinalIgnoreCase);
}
