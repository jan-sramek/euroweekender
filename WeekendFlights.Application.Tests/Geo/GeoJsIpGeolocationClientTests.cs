using Xunit;
using WeekendFlights.Infrastructure.Geo;

namespace WeekendFlights.Application.Tests.Geo;

public class GeoJsIpGeolocationClientTests
{
    [Fact]
    public void Parses_string_coordinates()
    {
        const string json = """
            {"city":"Ostrava","country":"Czechia","latitude":"49.8346","longitude":"18.2928"}
            """;

        var position = GeoJsIpGeolocationClient.TryParse(json);

        Assert.NotNull(position);
        Assert.Equal(49.8346, position.Latitude, 4);
        Assert.Equal(18.2928, position.Longitude, 4);
    }

    [Fact]
    public void Parses_numeric_coordinates()
    {
        const string json = """{"latitude":50.0755,"longitude":14.4378}""";

        var position = GeoJsIpGeolocationClient.TryParse(json);

        Assert.NotNull(position);
        Assert.Equal(50.0755, position.Latitude, 4);
        Assert.Equal(14.4378, position.Longitude, 4);
    }

    [Fact]
    public void Returns_null_on_error_payload()
    {
        Assert.Null(GeoJsIpGeolocationClient.TryParse("""{"error":"N/A"}"""));
        Assert.Null(GeoJsIpGeolocationClient.TryParse("not-json"));
        Assert.Null(GeoJsIpGeolocationClient.TryParse("""{"latitude":"0","longitude":"0"}"""));
    }
}
