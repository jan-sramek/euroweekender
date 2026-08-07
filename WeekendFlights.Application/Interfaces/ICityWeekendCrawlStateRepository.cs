using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ICityWeekendCrawlStateRepository
{
    Task<IReadOnlyList<CityWeekendCrawlState>> GetStatesFromAsync(
        DateTime weekendStartFromInclusive,
        CancellationToken cancellationToken = default);

    Task UpsertAsync(
        string cityCode,
        DateTime weekendStart,
        DateTime lastCrawledUtc,
        int lastOfferCount,
        CancellationToken cancellationToken = default);

    Task<int> DeleteBeforeAsync(
        DateTime weekendStartExclusive,
        CancellationToken cancellationToken = default);
}
