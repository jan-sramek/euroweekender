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

        while (true)
        {
            var response = await httpClient.GetAsync(
                $"https://api.tequila.kiwi.com/locations/dump?location_types=airport&limit={limit}&offset={offset}"
            );

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var locations = JsonDocument.Parse(json).RootElement.GetProperty("locations");

            if (locations.GetArrayLength() == 0)
                break;

            foreach (var item in locations.EnumerateArray())
            {
                var airport = new Airport
                {
                    KiwiId = item.GetProperty("int_id").GetInt32(),
                    IataCode = item.GetProperty("code").GetString()!,
                    IcaoCode = item.GetProperty("icao").GetString()!,
                    Name = item.GetProperty("name").GetString()!,
                    TimeZone = item.GetProperty("timezone").GetString()!,
                    Latitude = item.GetProperty("location").GetProperty("lat").GetDecimal(),
                    Longitude = item.GetProperty("location").GetProperty("lon").GetDecimal(),
                    Rank = item.GetProperty("rank").GetInt32(),
                    GlobalRankDestination = item.GetProperty("global_rank_dst").GetInt32(),
                    DestinationPopularityScore = item.GetProperty("dst_popularity_score").GetInt32()
                };
                
                //TODO: CityID from the DB
                // var cityId = item.GetProperty("city").GetProperty("id").GetInt32();
                // airport.CityId = GUID

                airports.Add(airport);
            }

            offset += limit;
        }

        return airports;
    }
}