using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class SeoPageContentRepository(WeekendFlightsDbContext db) : ISeoPageContentRepository
{
    public async Task<SeoPageContent?> GetAsync(
        string pageType,
        string originCode,
        string destinationCode,
        string locale,
        CancellationToken cancellationToken = default)
    {
        var type = pageType.Trim().ToLowerInvariant();
        var origin = originCode.Trim().ToUpperInvariant();
        var dest = (destinationCode ?? "").Trim().ToUpperInvariant();
        var lang = locale.Trim().ToLowerInvariant();

        return await db.SeoPageContents
            .AsNoTracking()
            .FirstOrDefaultAsync(
                row =>
                    row.PageType == type
                    && row.OriginCode == origin
                    && row.DestinationCode == dest
                    && row.Locale == lang,
                cancellationToken);
    }

    public async Task<IReadOnlyList<SeoPageContent>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await db.SeoPageContents
            .AsNoTracking()
            .OrderBy(row => row.PageType)
            .ThenBy(row => row.OriginCode)
            .ThenBy(row => row.DestinationCode)
            .ThenBy(row => row.Locale)
            .ToListAsync(cancellationToken);
    }

    public async Task UpsertManyAsync(
        IReadOnlyList<SeoPageContent> items,
        CancellationToken cancellationToken = default)
    {
        if (items.Count == 0) return;

        var existing = await db.SeoPageContents.ToListAsync(cancellationToken);
        var byKey = existing.ToDictionary(Key, StringComparer.Ordinal);

        foreach (var item in items)
        {
            Normalize(item);
            if (byKey.TryGetValue(Key(item), out var row))
            {
                row.Lead = item.Lead;
                row.Heading = item.Heading;
                row.MetaDescription = item.MetaDescription;
                row.Paragraphs = item.Paragraphs;
                row.Faq = item.Faq;
                row.SourceUrl = item.SourceUrl;
                row.SourceTitle = item.SourceTitle;
                row.GeneratedAt = item.GeneratedAt;
            }
            else
            {
                if (item.Id == Guid.Empty) item.Id = Guid.NewGuid();
                db.SeoPageContents.Add(item);
                byKey[Key(item)] = item;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string Key(SeoPageContent row) =>
        $"{row.PageType}:{row.OriginCode}:{row.DestinationCode}:{row.Locale}";

    private static void Normalize(SeoPageContent item)
    {
        item.PageType = item.PageType.Trim().ToLowerInvariant();
        item.OriginCode = item.OriginCode.Trim().ToUpperInvariant();
        item.DestinationCode = (item.DestinationCode ?? "").Trim().ToUpperInvariant();
        item.Locale = item.Locale.Trim().ToLowerInvariant();
    }
}
