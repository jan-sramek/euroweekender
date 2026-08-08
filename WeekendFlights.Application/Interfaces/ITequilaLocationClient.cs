using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Interfaces;

public interface ITequilaLocationClient
{
    Task<IReadOnlyList<TequilaCitySuggestion>> SuggestCitiesAsync(
        string term,
        string locale,
        int limit = 8,
        CancellationToken cancellationToken = default);
}
