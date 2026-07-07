using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;
using WeekendFlights.Domain.Entities;
using WeekendFlights.Infrastructure.Kiwi.Models;

namespace WeekendFlights.Infrastructure.Kiwi;

public sealed class TequilaApiSearchClient(
    HttpClient httpClient,
    ILogger<TequilaApiSearchClient> logger) : ITequilaApiSearchClient
{
    public async Task<IReadOnlyList<Flight>> SearchFlightsAsync(
        FlightSearchParameters parameters,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var url = KiwiSearchUrlBuilder.BuildSearchUrl(parameters);
            logger.LogDebug("Kiwi search request: {Url}", url);

            var response = await httpClient.GetAsync(url, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "Kiwi search failed with {StatusCode} for {From}. Response: {Body}",
                    (int)response.StatusCode, parameters.From, content);
                return [];
            }

            var searchResult = JsonSerializer.Deserialize<KiwiSearchResponse>(content, JsonSerializerOptions.Web);
            if (searchResult?.Data == null)
                return [];

            return searchResult.Data.Select(KiwiFlightMapper.ToDomain).ToList();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Error searching flights from {From}", parameters.From);
            return [];
        }
    }
}

internal sealed class TequilaApiSearchClientConfigurator(IConfiguration configuration)
{
    public void Configure(HttpClient client)
    {
        client.BaseAddress = new Uri("https://api.tequila.kiwi.com");
        client.Timeout = TimeSpan.FromSeconds(30);

        var apiKey = configuration["KiwiApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Kiwi API Key not configured");

        client.DefaultRequestHeaders.Remove("apikey");
        client.DefaultRequestHeaders.Add("apikey", apiKey);
    }
}
