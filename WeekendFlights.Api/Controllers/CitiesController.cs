using Microsoft.AspNetCore.Mvc;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/cities")]
public class CitiesController(
    ICityRepository cityRepository,
    IHubScoreService hubScoreService) : ControllerBase
{
    [HttpGet("hub-scores")]
    [ProducesResponseType(typeof(IReadOnlyList<OriginHubScoreDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OriginHubScoreDto>>> GetHubScoresAsync(
        [FromQuery] int weeks = WeekendHubIndex.DefaultWeeksAhead,
        CancellationToken cancellationToken = default)
    {
        var scores = await hubScoreService.GetHubScoresAsync(weeks, cancellationToken);
        var dtos = scores
            .Select(score => new OriginHubScoreDto(
                score.Code,
                score.OfferCount,
                score.MinPrice,
                score.AverageQuality,
                score.DestinationCount,
                score.HubScore))
            .ToList();

        return Ok(dtos);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CityDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CityDto>>> GetAsync(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var list = activeOnly
            ? await cityRepository.GetActiveCitiesAsync()
            : await cityRepository.GetAllCitiesAsync();

        var dtos = list.Select(c => new CityDto(
            c.Id,
            c.Code,
            c.Name,
            c.Country,
            c.Region,
            c.Continent,
            c.Latitude,
            c.Longitude,
            c.IsActive)).ToList();

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

        var dto = new CityDto(
            city.Id,
            city.Code,
            city.Name,
            city.Country,
            city.Region,
            city.Continent,
            city.Latitude,
            city.Longitude,
            city.IsActive);

        return Ok(dto);
    }
}
