using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ISeoPageContentRepository
{
    Task<SeoPageContent?> GetAsync(
        string pageType,
        string originCode,
        string destinationCode,
        string locale,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SeoPageContent>> GetAllAsync(CancellationToken cancellationToken = default);

    Task UpsertManyAsync(
        IReadOnlyList<SeoPageContent> items,
        CancellationToken cancellationToken = default);
}
