using System.Globalization;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Geo;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Infrastructure.Geo;

public sealed class GeoJsIpGeolocationClient(
    HttpClient httpClient,
    ILogger<GeoJsIpGeolocationClient> logger) : IIpGeolocationClient
{
    public async Task<IpGeoPosition?> LookupAsync(
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        if (!IPAddress.TryParse(ipAddress, out var parsed) || !ClientIp.IsPublicIp(parsed))
            return null;

        try
        {
            var url = $"/v1/ip/geo/{Uri.EscapeDataString(parsed.ToString())}.json";
            using var response = await httpClient.GetAsync(url, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "IP geolocation failed with {StatusCode} for {Ip}. Response: {Body}",
                    (int)response.StatusCode, parsed, content);
                return null;
            }

            return TryParse(content);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "IP geolocation lookup failed for {Ip}", parsed);
            return null;
        }
    }

    public static IpGeoPosition? TryParse(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (root.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.String)
                return null;

            if (!TryGetCoordinate(root, "latitude", out var latitude) ||
                !TryGetCoordinate(root, "longitude", out var longitude))
            {
                return null;
            }

            if (latitude == 0 && longitude == 0)
                return null;

            return new IpGeoPosition(latitude, longitude);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool TryGetCoordinate(JsonElement root, string name, out double value)
    {
        value = 0;
        if (!root.TryGetProperty(name, out var property))
            return false;

        switch (property.ValueKind)
        {
            case JsonValueKind.Number:
                return property.TryGetDouble(out value) && double.IsFinite(value);
            case JsonValueKind.String:
                return double.TryParse(
                    property.GetString(),
                    NumberStyles.Float,
                    CultureInfo.InvariantCulture,
                    out value) && double.IsFinite(value);
            default:
                return false;
        }
    }
}
