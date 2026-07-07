using System.Net;
using System.Text.Json;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Kiwi;

public class KiwiApiClient(HttpClient httpClient) : IKiwiApiClient
{
    public async Task<List<City>> LoadCitiesAsync(string apiKey)
    {
        var cities = new List<City>();
        var addedCities = new HashSet<string>();

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("apikey", apiKey);

        int limit = 1000;
        string? searchAfter1 = null;
        string? searchAfter2 = null;
        int i = 0;
        while (true)
        {
            var url =
                $"https://api.tequila.kiwi.com/locations/dump?location_types=city&limit={limit}&sort=rank&locale=en-US&active_only=true";
            if (searchAfter1 != null && searchAfter2 != null)
            {
                url += $"&search_after={Uri.EscapeDataString(searchAfter1)}";
                url += $"&search_after={Uri.EscapeDataString(searchAfter2)}";
            }
            var response = await httpClient.GetAsync(url);
            
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                await Task.Delay(1000 * (++i)); // exponential backoff

                if (i == 10)
                {
                    break;
                }
                continue;
            }

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var root = JsonDocument.Parse(json).RootElement;
            var locations = root.GetProperty("locations");

            if (locations.GetArrayLength() == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                var city = new City
                {
                    KiwiId = item.GetProperty("id").GetString()!,
                    Name = item.GetProperty("name").GetString()!,
                    Code = item.GetProperty("code").GetString()!,
                    Country = item.GetProperty("country").GetProperty("name").GetString()!,
                    Region = item.GetProperty("region").GetProperty("name").GetString(),
                    Continent = item.GetProperty("continent").GetProperty("name").GetString()!,
                    Latitude = item.GetProperty("location").GetProperty("lat").GetDecimal(),
                    Longitude = item.GetProperty("location").GetProperty("lon").GetDecimal(),
                    Airports = new List<Airport>()
                };

                if (!addedCities.Contains(city.KiwiId) && !string.IsNullOrWhiteSpace(city.Code))
                {
                    cities.Add(city);
                    addedCities.Add(city.KiwiId);
                }
            }
            
            if (!root.TryGetProperty("search_after", out var searchAfter))
                break;

            searchAfter1 = searchAfter[0].GetRawText();
            searchAfter2 = searchAfter[1].GetRawText();
            
            await Task.Delay(200);
        }

        return cities;
    }
    
    public async Task<List<Airport>> LoadAirportsAsync(string apiKey)
    {
        var airports = new List<Airport>();

        httpClient.DefaultRequestHeaders.Clear();
        httpClient.DefaultRequestHeaders.Add("apikey", apiKey);

        int limit = 1000;
        int offset = 0;
        string? searchAfter1 = null;
        string? searchAfter2 = null;
        int i = 0;
        while (true)
        {
            
            var url = $"https://api.tequila.kiwi.com/locations/dump?location_types=airport&limit={limit}&sort=rank&locale=en-US&active_only=true";;
            if (searchAfter1 != null && searchAfter2 != null)
            {
                url += $"&search_after={Uri.EscapeDataString(searchAfter1)}";
                url += $"&search_after={Uri.EscapeDataString(searchAfter2)}";
            }
            
            var response = await httpClient.GetAsync(url);
            
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                await Task.Delay(1000 * (++i)); // exponential backoff

                if (i == 10)
                {
                    break;
                }
                continue;
            }

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var root = JsonDocument.Parse(json).RootElement;
            var locations = root.GetProperty("locations");

            if (locations.GetArrayLength() == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                var airport = new Airport
                {
                    KiwiId = item.TryGetProperty("int_id", out var intIdProp) && intIdProp.ValueKind == JsonValueKind.Number
                        ? intIdProp.GetInt32()
                        : 0,

                    IataCode = item.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == JsonValueKind.String
                        ? codeProp.GetString()!
                        : string.Empty,

                    IcaoCode = item.TryGetProperty("icao", out var icaoProp) && icaoProp.ValueKind == JsonValueKind.String
                        ? icaoProp.GetString()!
                        : string.Empty,

                    Name = item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String
                        ? nameProp.GetString()!
                        : string.Empty,

                    TimeZone = item.TryGetProperty("timezone", out var tzProp) && tzProp.ValueKind == JsonValueKind.String
                        ? tzProp.GetString()!
                        : string.Empty,

                    Latitude = item.TryGetProperty("location", out var locProp) &&
                               locProp.TryGetProperty("lat", out var latProp) &&
                               latProp.ValueKind == JsonValueKind.Number
                        ? latProp.GetDouble()
                        : 0,

                    Longitude = item.TryGetProperty("location", out var locPropAgain) &&
                                locPropAgain.TryGetProperty("lon", out var lonProp) &&
                                lonProp.ValueKind == JsonValueKind.Number
                        ? lonProp.GetDouble()
                        : 0,

                    Rank = item.TryGetProperty("rank", out var rankProp) && rankProp.ValueKind == JsonValueKind.Number
                        ? rankProp.GetInt32()
                        : 0,

                    GlobalRankDestination = item.TryGetProperty("global_rank_dst", out var globalRankProp) &&
                                            globalRankProp.ValueKind == JsonValueKind.Number
                        ? globalRankProp.GetInt32()
                        : 0,

                    DestinationPopularityScore = item.TryGetProperty("dst_popularity_score", out var popScoreProp) &&
                                                 popScoreProp.ValueKind == JsonValueKind.Number
                        ? popScoreProp.GetDouble() 
                        : 0,
                    
                    CityKiwiId = item.TryGetProperty("city", out var cityProp) &&
                                 cityProp.ValueKind == JsonValueKind.Object &&
                                 cityProp.TryGetProperty("id", out var cityIdProp) &&
                                 cityIdProp.ValueKind == JsonValueKind.String
                    ? cityIdProp.GetString()!
                    
                    : string.Empty,
                };
                
                

                airports.Add(airport);
            }
            
            if (!root.TryGetProperty("search_after", out var searchAfter))
                break;

            searchAfter1 = searchAfter[0].GetRawText();
            searchAfter2 = searchAfter[1].GetRawText();
            
            await Task.Delay(500);

            offset += limit;
        }

        return airports;
    }
}