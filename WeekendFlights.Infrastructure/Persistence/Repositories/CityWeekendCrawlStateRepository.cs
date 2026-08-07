using Microsoft.EntityFrameworkCore;
using WeekendFlights.Application.Interfaces;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence.Repositories;

public class CityWeekendCrawlStateRepository(WeekendFlightsDbContext db) : ICityWeekendCrawlStateRepository
{
    public async Task<IReadOnlyList<CityWeekendCrawlState>> GetStatesFromAsync(
        DateTime weekendStartFromInclusive,
        CancellationToken cancellationToken = default)
    {
        return await db.CityWeekendCrawlStates
            .AsNoTracking()
            .Where(s => s.WeekendStart >= weekendStartFromInclusive)
            .ToListAsync(cancellationToken);
    }

    public async Task UpsertAsync(
        string cityCode,
        DateTime weekendStart,
        DateTime lastCrawledUtc,
        int lastOfferCount,
        CancellationToken cancellationToken = default)
    {
        var existing = await db.CityWeekendCrawlStates
            .FirstOrDefaultAsync(
                s => s.CityCode == cityCode && s.WeekendStart == weekendStart,
                cancellationToken);

        if (existing is null)
        {
            await db.CityWeekendCrawlStates.AddAsync(new CityWeekendCrawlState
            {
                CityCode = cityCode,
                WeekendStart = weekendStart,
                LastCrawledUtc = lastCrawledUtc,
                LastOfferCount = lastOfferCount
            }, cancellationToken);
        }
        else
        {
            existing.LastCrawledUtc = lastCrawledUtc;
            existing.LastOfferCount = lastOfferCount;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> DeleteBeforeAsync(
        DateTime weekendStartExclusive,
        CancellationToken cancellationToken = default)
    {
        return await db.CityWeekendCrawlStates
            .Where(s => s.WeekendStart < weekendStartExclusive)
            .ExecuteDeleteAsync(cancellationToken);
    }
}
