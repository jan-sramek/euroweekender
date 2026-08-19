using Microsoft.AspNetCore.Mvc;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Geo;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/geo")]
public class GeoController(IIpGeolocationClient ipGeolocationClient) : ControllerBase
{
    [HttpGet("ip")]
    [ProducesResponseType(typeof(IpGeoPositionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<IpGeoPositionDto>> GetByIpAsync(CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "private, no-store";

        var cloudflare = ClientIp.TryCloudflarePosition(
            Request.Headers["CF-IPLatitude"].ToString(),
            Request.Headers["CF-IPLongitude"].ToString());
        if (cloudflare is not null)
            return Ok(new IpGeoPositionDto(cloudflare.Latitude, cloudflare.Longitude));

        var ip = ClientIp.Resolve(
            Request.Headers["CF-Connecting-IP"].ToString(),
            Request.Headers["X-Forwarded-For"].ToString(),
            Request.Headers["X-Real-IP"].ToString(),
            HttpContext.Connection.RemoteIpAddress?.ToString());

        if (string.IsNullOrWhiteSpace(ip))
            return NoContent();

        var position = await ipGeolocationClient.LookupAsync(ip, cancellationToken);
        if (position is null)
            return NoContent();

        return Ok(new IpGeoPositionDto(position.Latitude, position.Longitude));
    }
}
