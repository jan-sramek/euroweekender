using Xunit;
using WeekendFlights.Application.Services;

namespace WeekendFlights.Application.Tests.Services;

public class TequilaLocaleMapperTests
{
    [Theory]
    [InlineData("cs", "cs-CZ")]
    [InlineData("cs-CZ", "cs-CZ")]
    [InlineData("de", "de-DE")]
    [InlineData("en", "en-US")]
    [InlineData(null, "en-US")]
    [InlineData("", "en-US")]
    public void Maps_app_language_to_tequila_locale(string? language, string expected)
    {
        Assert.Equal(expected, TequilaLocaleMapper.ToTequilaLocale(language));
    }
}
