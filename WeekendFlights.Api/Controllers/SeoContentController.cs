using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using WeekendFlights.Api.Contracts;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Api.Controllers;

[ApiController]
[Route("api/seo-content")]
public class SeoContentController(
    ISeoPageContentRepository repository,
    IMemoryCache memoryCache,
    IConfiguration configuration) : ControllerBase
{
    private static readonly TimeSpan SnapshotCacheDuration = TimeSpan.FromHours(6);
    private const string SnapshotCacheKey = "seo-content:snapshot:v1";

    [HttpGet]
    [ProducesResponseType(typeof(SeoPageContentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<SeoPageContentDto>> GetAsync(
        [FromQuery] string pageType,
        [FromQuery] string origin,
        [FromQuery] string? destination,
        [FromQuery] string locale,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(pageType)
            || string.IsNullOrWhiteSpace(origin)
            || string.IsNullOrWhiteSpace(locale))
        {
            return BadRequest();
        }

        Response.Headers.CacheControl = "public, max-age=3600";

        var row = await repository.GetAsync(
            pageType,
            origin,
            destination ?? "",
            locale,
            cancellationToken);
        if (row is null) return NotFound();
        return Ok(ToDto(row));
    }

    [HttpGet("snapshot")]
    [ProducesResponseType(typeof(SeoPageContentSnapshotDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SeoPageContentSnapshotDto>> GetSnapshotAsync(
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "public, max-age=3600";

        if (!memoryCache.TryGetValue(SnapshotCacheKey, out SeoPageContentSnapshotDto? snapshot)
            || snapshot is null)
        {
            snapshot = ToSnapshot(await repository.GetAllAsync(cancellationToken));
            memoryCache.Set(SnapshotCacheKey, snapshot, SnapshotCacheDuration);
        }

        return Ok(snapshot);
    }

    [HttpPut("import")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ImportAsync(
        [FromBody] SeoPageContentSnapshotDto body,
        CancellationToken cancellationToken)
    {
        var expectedKey = configuration["SeoContent:ImportKey"];
        if (string.IsNullOrWhiteSpace(expectedKey)) return NotFound();

        if (!Request.Headers.TryGetValue("X-Seo-Import-Key", out var provided)
            || !string.Equals(provided.ToString(), expectedKey, StringComparison.Ordinal))
        {
            return Unauthorized();
        }

        var items = body.Pages.Values.Select(FromDto).ToList();
        await repository.UpsertManyAsync(items, cancellationToken);
        memoryCache.Remove(SnapshotCacheKey);
        return NoContent();
    }

    private static SeoPageContentSnapshotDto ToSnapshot(IReadOnlyList<SeoPageContent> rows)
    {
        var pages = new Dictionary<string, SeoPageContentDto>(StringComparer.Ordinal);
        DateTimeOffset generatedAt = DateTimeOffset.MinValue;
        foreach (var row in rows)
        {
            pages[ContentKey(row)] = ToDto(row);
            if (row.GeneratedAt > generatedAt) generatedAt = row.GeneratedAt;
        }

        if (generatedAt == DateTimeOffset.MinValue) generatedAt = DateTimeOffset.UtcNow;
        return new SeoPageContentSnapshotDto(generatedAt, pages.Count, pages);
    }

    private static SeoPageContentDto ToDto(SeoPageContent row) =>
        new(
            row.PageType,
            row.OriginCode,
            row.DestinationCode,
            row.Locale,
            row.Lead,
            row.Heading,
            row.MetaDescription,
            row.Paragraphs,
            row.Faq.Select(item => new SeoFaqDto(item.Q, item.A)).ToList(),
            row.SourceUrl,
            row.SourceTitle,
            row.GeneratedAt);

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

    private static string ContentKey(SeoPageContent row)
    {
        return string.IsNullOrEmpty(row.DestinationCode)
            ? $"{row.PageType}:{row.OriginCode}:{row.Locale}"
            : $"{row.PageType}:{row.OriginCode}:{row.DestinationCode}:{row.Locale}";
    }
}
