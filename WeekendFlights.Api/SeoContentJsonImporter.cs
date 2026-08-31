using System.Text.Json;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Api;

public static class SeoContentJsonImporter
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static async Task<int> ImportFileAsync(
        ISeoPageContentRepository repository,
        string jsonPath,
        CancellationToken cancellationToken = default)
    {
        await using var stream = File.OpenRead(jsonPath);
        var snapshot = await JsonSerializer.DeserializeAsync<SeoPageContentSnapshotDto>(
            stream,
            JsonOptions,
            cancellationToken)
            ?? throw new InvalidOperationException($"Could not parse SEO snapshot at {jsonPath}.");

        var items = snapshot.Pages.Values.Select(FromDto).ToList();
        await repository.UpsertManyAsync(items, cancellationToken);
        return items.Count;
    }

    private static SeoPageContent FromDto(SeoPageContentDto dto) =>
        new()
        {
            PageType = dto.PageType,
            OriginCode = dto.OriginCode,
            DestinationCode = dto.DestinationCode ?? "",
            Locale = dto.Locale,
            Lead = dto.Lead,
            Heading = dto.Heading,
            MetaDescription = dto.MetaDescription,
            Paragraphs = dto.Paragraphs.ToList(),
            Faq = dto.Faq.Select(item => new SeoFaqItem { Q = item.Q, A = item.A }).ToList(),
            SourceUrl = dto.SourceUrl,
            SourceTitle = dto.SourceTitle,
            GeneratedAt = dto.GeneratedAt == default ? DateTimeOffset.UtcNow : dto.GeneratedAt
        };
}
