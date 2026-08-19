using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Interfaces;

public interface IIpGeolocationClient
{
    Task<IpGeoPosition?> LookupAsync(string ipAddress, CancellationToken cancellationToken = default);
}
