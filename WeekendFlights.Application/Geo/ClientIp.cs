using System.Net;
using System.Net.Sockets;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Geo;

public static class ClientIp
{
    public static string? Resolve(
        string? cfConnectingIp,
        string? forwardedFor,
        string? realIp,
        string? remoteIp)
    {
        if (TryPublicIp(cfConnectingIp, out var cf))
            return cf;

        // Walk X-Forwarded-For from the right so a spoofed leftmost value is ignored.
        if (!string.IsNullOrWhiteSpace(forwardedFor))
        {
            var parts = forwardedFor.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
            for (var i = parts.Length - 1; i >= 0; i--)
            {
                if (TryPublicIp(parts[i], out var hop))
                    return hop;
            }
        }

        if (TryPublicIp(realIp, out var real))
            return real;

        return TryPublicIp(remoteIp, out var remote) ? remote : null;
    }

    public static IpGeoPosition? TryCloudflarePosition(string? latitude, string? longitude)
    {
        if (!TryCoordinate(latitude, out var lat) || !TryCoordinate(longitude, out var lon))
            return null;
        if (lat == 0 && lon == 0)
            return null;
        return new IpGeoPosition(lat, lon);
    }

    public static bool IsPublicIp(IPAddress address)
    {
        if (address.IsIPv4MappedToIPv6)
            address = address.MapToIPv4();

        if (IPAddress.IsLoopback(address))
            return false;

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var bytes = address.GetAddressBytes();
            return bytes[0] switch
            {
                0 or 10 or 127 => false,
                169 when bytes[1] == 254 => false,
                172 when bytes[1] is >= 16 and <= 31 => false,
                192 when bytes[1] == 168 => false,
                _ => true
            };
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            return !address.IsIPv6LinkLocal
                   && !address.IsIPv6SiteLocal
                   && !address.IsIPv6Multicast
                   && !address.IsIPv6UniqueLocal;
        }

        return false;
    }

    private static bool TryPublicIp(string? value, out string ip)
    {
        ip = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        if (!IPAddress.TryParse(value.Trim(), out var parsed) || !IsPublicIp(parsed))
            return false;
        ip = parsed.ToString();
        return true;
    }

    private static bool TryCoordinate(string? value, out double coordinate)
    {
        return double.TryParse(
            value,
            System.Globalization.NumberStyles.Float,
            System.Globalization.CultureInfo.InvariantCulture,
            out coordinate) && double.IsFinite(coordinate);
    }
}
