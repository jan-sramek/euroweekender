using WeekendFlights.Application.Models;

namespace WeekendFlights.Application.Interfaces;

public interface IHubScoreService
{
    Task<IReadOnlyList<OriginHubScore>> GetHubScoresAsync(
        int weeksAhead,
        CancellationToken cancellationToken = default);
}
