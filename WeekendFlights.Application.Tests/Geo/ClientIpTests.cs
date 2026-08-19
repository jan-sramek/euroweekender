using Xunit;
using WeekendFlights.Application.Geo;

namespace WeekendFlights.Application.Tests.Geo;

public class ClientIpTests
{
    [Fact]
    public void Prefers_cloudflare_connecting_ip()
    {
        var ip = ClientIp.Resolve("203.0.113.10", "198.51.100.1, 172.18.0.5", "172.18.0.5", "172.18.0.5");
        Assert.Equal("203.0.113.10", ip);
    }

    [Fact]
    public void Uses_rightmost_public_forwarded_for_hop()
    {
        var ip = ClientIp.Resolve(null, "198.51.100.1, 203.0.113.10, 172.18.0.5", "172.18.0.5", "10.0.0.8");
        Assert.Equal("203.0.113.10", ip);
    }

    [Fact]
    public void Ignores_loopback_and_private_addresses()
    {
        var ip = ClientIp.Resolve(null, "127.0.0.1", "192.168.1.10", "::1");
        Assert.Null(ip);
    }

    [Fact]
    public void Parses_cloudflare_coordinates()
    {
        var position = ClientIp.TryCloudflarePosition("49.8346", "18.2928");
        Assert.NotNull(position);
        Assert.Equal(49.8346, position.Latitude, 4);
        Assert.Equal(18.2928, position.Longitude, 4);
    }

    [Fact]
    public void Rejects_zero_cloudflare_coordinates()
    {
        Assert.Null(ClientIp.TryCloudflarePosition("0", "0"));
    }
}
