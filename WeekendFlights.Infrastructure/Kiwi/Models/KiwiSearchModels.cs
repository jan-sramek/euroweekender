using System.Text.Json.Serialization;

namespace WeekendFlights.Infrastructure.Kiwi.Models;

internal sealed class KiwiSearchResponse
{
    [JsonPropertyName("search_id")]
    public string SearchId { get; set; } = string.Empty;

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = string.Empty;

    [JsonPropertyName("fx_rate")]
    public decimal FxRate { get; set; }

    [JsonPropertyName("data")]
    public List<KiwiFlightData>? Data { get; set; }
}

internal sealed class KiwiFlightData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("booking_token")]
    public string BookingToken { get; set; } = string.Empty;

    [JsonPropertyName("countryFrom")]
    public KiwiCountry? CountryFrom { get; set; }

    [JsonPropertyName("countryTo")]
    public KiwiCountry? CountryTo { get; set; }

    [JsonPropertyName("flyFrom")]
    public string FlyFrom { get; set; } = string.Empty;

    [JsonPropertyName("flyTo")]
    public string FlyTo { get; set; } = string.Empty;

    [JsonPropertyName("cityFrom")]
    public string CityFrom { get; set; } = string.Empty;

    [JsonPropertyName("cityTo")]
    public string CityTo { get; set; } = string.Empty;

    [JsonPropertyName("cityCodeFrom")]
    public string CityCodeFrom { get; set; } = string.Empty;

    [JsonPropertyName("cityCodeTo")]
    public string CityCodeTo { get; set; } = string.Empty;

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public KiwiDuration? Duration { get; set; }

    [JsonPropertyName("facilitated_booking_available")]
    public bool FacilitatedBookingAvailable { get; set; }

    [JsonPropertyName("fare")]
    public KiwiFare? Fare { get; set; }

    [JsonPropertyName("has_airport_change")]
    public bool HasAirportChange { get; set; }

    [JsonPropertyName("local_arrival")]
    public DateTime LocalArrival { get; set; }

    [JsonPropertyName("local_departure")]
    public DateTime LocalDeparture { get; set; }

    [JsonPropertyName("route")]
    public List<KiwiRouteSegment>? Route { get; set; }

    [JsonPropertyName("nightsInDest")]
    public int? NightsInDest { get; set; }

    [JsonPropertyName("pnr_count")]
    public int PnrCount { get; set; }

    [JsonPropertyName("price")]
    public double Price { get; set; }

    [JsonPropertyName("quality")]
    public double Quality { get; set; }

    [JsonPropertyName("technical_stops")]
    public int TechnicalStops { get; set; }

    [JsonPropertyName("throw_away_ticketing")]
    public bool ThrowAwayTicketing { get; set; }

    [JsonPropertyName("hidden_city_ticketing")]
    public bool HiddenCityTicketing { get; set; }

    [JsonPropertyName("availability")]
    public KiwiAvailability? Availability { get; set; }

    [JsonPropertyName("virtual_interlining")]
    public bool VirtualInterlining { get; set; }

    [JsonPropertyName("utc_arrival")]
    public DateTime UtcArrival { get; set; }

    [JsonPropertyName("utc_departure")]
    public DateTime UtcDeparture { get; set; }

    [JsonPropertyName("deep_link")]
    public string? DeepLink { get; set; }
}

internal sealed class KiwiCountry
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

internal sealed class KiwiDuration
{
    [JsonPropertyName("departure")]
    public int Departure { get; set; }

    [JsonPropertyName("return")]
    public int Return { get; set; }

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

internal sealed class KiwiFare
{
    [JsonPropertyName("adults")]
    public decimal Adults { get; set; }

    [JsonPropertyName("children")]
    public decimal Children { get; set; }

    [JsonPropertyName("infants")]
    public decimal Infants { get; set; }
}

internal sealed class KiwiAvailability
{
    [JsonPropertyName("seats")]
    public int? Seats { get; set; }
}

internal sealed class KiwiRouteSegment
{
    [JsonPropertyName("flyFrom")]
    public string FlyFrom { get; set; } = string.Empty;

    [JsonPropertyName("flyTo")]
    public string FlyTo { get; set; } = string.Empty;

    [JsonPropertyName("return")]
    public int Return { get; set; }

    [JsonPropertyName("local_departure")]
    public DateTime LocalDeparture { get; set; }

    [JsonPropertyName("local_arrival")]
    public DateTime LocalArrival { get; set; }
}
