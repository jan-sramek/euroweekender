using Microsoft.AspNetCore.Mvc;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/flights")]
public class FlightsController(IFlightRepository flightRepository) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedFlightsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedFlightsDto>> GetAsync(
        [FromQuery] string? cityCodeFrom,
        [FromQuery] string? cityCodeTo,
        [FromQuery] DateTime? departFromUtc,
        [FromQuery] DateTime? departToUtc,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var skip = (page - 1) * pageSize;

        var (items, total) = await flightRepository.GetFlightsAsync(
            cityCodeFrom,
            cityCodeTo,
            departFromUtc,
            departToUtc,
            skip,
            pageSize,
            cancellationToken);

        var dtos = items.Select(ToDto).ToList();
        return Ok(new PagedFlightsDto(dtos, total, page, pageSize));
    }

    private static FlightDto ToDto(Flight f) => new(
        f.Id,
        f.KiwiId,
        f.CountryFrom,
        f.CountryTo,
        f.DeepLink,
        f.Distance,
        f.DurationDeparture,
        f.DurationReturn,
        f.DurationTotal,
        f.FacilitatedBookingAvailable,
        f.FareAdults,
        f.NightsInDest,
        f.Price,
        f.Quality,
        f.TechnicalStops,
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
        f.UtcArrival,
        f.UtcDeparture,
        f.AvailabilitySeats);
}
