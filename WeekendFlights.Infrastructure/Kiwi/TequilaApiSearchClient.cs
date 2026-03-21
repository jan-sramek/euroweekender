using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Kiwi;

public class TequilaApiSearchSearchClient : ITequilaApiSearchClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TequilaApiSearchSearchClient> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl = "https://api.tequila.kiwi.com/v2";

    public TequilaApiSearchSearchClient(HttpClient httpClient, IConfiguration configuration, ILogger<TequilaApiSearchSearchClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = _configuration["KiwiApiKey"] ?? throw new ArgumentNullException("Kiwi API Key not configured");
        _httpClient.DefaultRequestHeaders.Add("apikey", _apiKey);
    }

    public async Task<List<Flight>> SearchFlightsAsync(
        string from,
        DateTime dateFrom, 
        DateTime dateTo, 
        DateTime returnFrom, 
        DateTime returnTo, 
        int nightsInDstFrom,
        int nightsInDstTo,
        int maxFlyDuration,
        int adults,
        int children,
        int infants,
        decimal priceTo,
        decimal maxStopOvers,
        string currency,
        int limit)
    {
        try
        {
            var url = $"{_baseUrl}/search?" +
                     $"fly_from={from}&" +
                     $"date_from={dateFrom:dd/MM/yyyy}&" +
                     $"date_to={dateTo:dd/MM/yyyy}&" +
                     $"return_from={returnFrom:dd/MM/yyyy}&" +
                     $"return_to={returnTo:dd/MM/yyyy}&" +
                     $"nights_in_dst_from={nightsInDstFrom}&" +
                     $"nights_in_dst_to={nightsInDstTo}&" +
                     $"max_fly_duration={maxFlyDuration}&" +
                     $"adults={adults}&" +
                     $"children={children}&" +
                     $"infants={infants}&" +
                     $"fly_days_type=departure&" +
                     $"ret_fly_days_type=departure&" +
                     $"fly_days=3&" +
                     $"fly_days=4&" +
                     $"ret_fly_days=0&" +
                     $"ret_fly_days=1&" +
                     $"price_to={priceTo}&" +
                     $"curr={currency}&" +
                     $"max_stopovers={maxStopOvers}&" +
                     $"sort=price&" +
                     $"limit={limit}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var searchResult = JsonSerializer.Deserialize<KiwiSearchResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (searchResult?.Data == null) return new List<Flight>();

            var flights = searchResult.Data.Select(d => new Flight
            {
                KiwiId = d.Id,
                BookingToken = d.BookingToken,
                CountryFrom = d.CountryFrom?.Name,
                CountryTo = d.CountryTo?.Name,
                FlyFrom = d.FlyFrom,
                FlyTo = d.FlyTo,
                CityFrom = d.CityFrom,
                CityTo = d.CityTo,
                CityCodeFrom = d.CityCodeFrom,
                CityCodeTo = d.CityCodeTo,
                Distance = d.Distance,
                DurationDeparture = d.Duration?.Departure / 60m ?? 0, // convert minutes to hours
                DurationReturn = d.Duration?.Return / 60m ?? 0,
                DurationTotal = d.Duration?.Total / 60m ?? 0,
                FacilitatedBookingAvailable = d.FacilitatedBookingAvailable,
                FareAdults = d.Fare?.Adults ?? 0,
                FareChildern = d.Fare?.Children ?? 0,
                FareInfants = d.Fare?.Infants ?? 0,
                HasAirportChange = d.HasAirportChange,
                LocalArrival = d.LocalArrival,
                LocalDeparture = d.LocalDeparture,
                NightsInDest = d.NightsInDest ?? 0,
                PnrCount = d.PnrCount,
                Price = d.Price,
                Quality = d.Quality,
                TechnicalStops = d.TechnicalStops,
                ThrowAwayTicketing = d.ThrowAwayTicketing,
                HiddenCityTicketing = d.HiddenCityTicketing,
                AvailabilitySeats = d.Availability?.Seats ?? 0,
                VirtualInterlining = d.VirtualInterlining,
                UtcArrival = d.UtcArrival,
                UtcDeparture = d.UtcDeparture
            }).ToList();

            return flights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching flights from {From} to {To}", from, "destination unknown");
            return new List<Flight>();
        }
    }
}

// Kiwi API Response Models
public class KiwiSearchResponse
{
    [JsonPropertyName("search_id")]
    public string SearchId { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; }

    [JsonPropertyName("fx_rate")]
    public decimal FxRate { get; set; }

    [JsonPropertyName("data")]
    public List<KiwiFlightData> Data { get; set; }
}

public class KiwiFlightData
{
    [JsonPropertyName("id")]
    public string Id { get; set; }

    [JsonPropertyName("booking_token")]
    public string BookingToken { get; set; }

    [JsonPropertyName("countryFrom")]
    public KiwiCountry CountryFrom { get; set; }

    [JsonPropertyName("countryTo")]
    public KiwiCountry CountryTo { get; set; }

    [JsonPropertyName("flyFrom")]
    public string FlyFrom { get; set; }

    [JsonPropertyName("flyTo")]
    public string FlyTo { get; set; }

    [JsonPropertyName("cityFrom")]
    public string CityFrom { get; set; }

    [JsonPropertyName("cityTo")]
    public string CityTo { get; set; }

    [JsonPropertyName("cityCodeFrom")]
    public string CityCodeFrom { get; set; }

    [JsonPropertyName("cityCodeTo")]
    public string CityCodeTo { get; set; }

    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public KiwiDuration Duration { get; set; }

    [JsonPropertyName("facilitated_booking_available")]
    public bool FacilitatedBookingAvailable { get; set; }

    [JsonPropertyName("fare")]
    public KiwiFare Fare { get; set; }

    [JsonPropertyName("has_airport_change")]
    public bool HasAirportChange { get; set; }

    [JsonPropertyName("local_arrival")]
    public DateTime LocalArrival { get; set; }

    [JsonPropertyName("local_departure")]
    public DateTime LocalDeparture { get; set; }

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
    public KiwiAvailability Availability { get; set; }

    [JsonPropertyName("virtual_interlining")]
    public bool VirtualInterlining { get; set; }

    [JsonPropertyName("utc_arrival")]
    public DateTime UtcArrival { get; set; }

    [JsonPropertyName("utc_departure")]
    public DateTime UtcDeparture { get; set; }
}

public class KiwiCountry
{
    [JsonPropertyName("code")]
    public string Code { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }
}

public class KiwiDuration
{
    [JsonPropertyName("departure")]
    public int Departure { get; set; }

    [JsonPropertyName("return")]
    public int Return { get; set; }

    [JsonPropertyName("total")]
    public int Total { get; set; }
}

public class KiwiFare
{
    [JsonPropertyName("adults")]
    public decimal Adults { get; set; }

    [JsonPropertyName("children")]
    public decimal Children { get; set; }

    [JsonPropertyName("infants")]
    public decimal Infants { get; set; }
}

public class KiwiAvailability
{
    [JsonPropertyName("seats")]
    public int? Seats { get; set; }
}
