using System.Text.Json;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Infrastructure.Kiwi;

public sealed class TequilaLocationClient(
    HttpClient httpClient,
    ILogger<TequilaLocationClient> logger) : ITequilaLocationClient
{
    public async Task<IReadOnlyList<TequilaCitySuggestion>> SuggestCitiesAsync(
        string term,
        string locale,
        int limit = 8,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(term) || limit <= 0)
            return [];

        try
        {
            var url =
                $"/locations/query?term={Uri.EscapeDataString(term.Trim())}" +
                $"&locale={Uri.EscapeDataString(locale)}" +
                $"&location_types=city&limit={limit}&active_only=true";

            using var response = await httpClient.GetAsync(url, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Kiwi locations query failed with {StatusCode} for term {Term}. Response: {Body}",
                    (int)response.StatusCode, term, content);
                return [];
            }

            using var document = JsonDocument.Parse(content);
            if (!document.RootElement.TryGetProperty("locations", out var locations) ||
                locations.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            var results = new List<TequilaCitySuggestion>();
            foreach (var item in locations.EnumerateArray())
            {
                var code = item.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == JsonValueKind.String
                    ? codeProp.GetString()
                    : null;
                var name = item.TryGetProperty("name", out var nameProp) && nameProp.ValueKind == JsonValueKind.String
                    ? nameProp.GetString()
                    : null;
                var country = item.TryGetProperty("country", out var countryProp) &&
                              countryProp.ValueKind == JsonValueKind.Object &&
                              countryProp.TryGetProperty("name", out var countryNameProp) &&
                              countryNameProp.ValueKind == JsonValueKind.String
                    ? countryNameProp.GetString()
                    : null;

                if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
                    continue;

                results.Add(new TequilaCitySuggestion(code, name, country ?? string.Empty));
            }

            return results;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Error suggesting cities for term {Term}", term);
            return [];
        }
    }
}
