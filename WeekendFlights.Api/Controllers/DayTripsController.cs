using Microsoft.AspNetCore.Mvc;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Models;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/day-trips")]
public class DayTripsController(IDayTripLiveSearchService dayTripLiveSearchService) : ControllerBase
{
    public sealed record LiveSearchRequest(string[] CityCodeFrom, string[] Dates);

    /// <summary>
    /// Live-search Kiwi for morning-out / evening-back same-day trips (capped),
    /// store matches, and return them.
    /// </summary>
    [HttpPost("search")]
    [ProducesResponseType(typeof(PagedFlightsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedFlightsDto>> SearchLiveAsync(
        [FromBody] LiveSearchRequest request,
        CancellationToken cancellationToken = default)
    {
        var cities = request.CityCodeFrom ?? [];
        var days = new List<DateTime>();
        foreach (var raw in request.Dates ?? [])
        {
            if (DateTime.TryParse(raw, out var day))
                days.Add(day.Date);
        }

        var items = await dayTripLiveSearchService.SearchAndStoreAsync(cities, days, cancellationToken);
        var dtos = items.Select(ToDto).ToList();
        return Ok(new PagedFlightsDto(dtos, dtos.Count, 1, dtos.Count == 0 ? 1 : dtos.Count));
    }

    private static FlightSearchDto ToDto(FlightListItem f) => new(
        f.Id,
        f.CountryTo,
        f.CountryFrom,
        f.DeepLink,
        f.FareAdults,
        f.NightsInDest,
        f.Price,
        f.TechnicalStops,
        f.DurationDeparture,
        f.DurationReturn,
        f.FlyTo,
        f.FlyFrom,
        f.CityFrom,
        f.CityTo,
        f.CityCodeFrom,
        f.CityCodeTo,
        f.LocalArrival,
        f.LocalDeparture,
        f.LocalReturnDeparture,
        f.LocalReturnArrival,
        f.AvailabilitySeats);
}
