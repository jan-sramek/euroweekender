using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Application.Interfaces;

public interface ITequilaApiSearchClient
{
    Task<List<Flight>> SearchFlightsAsync(
        string from,
        DateTime dateFrom, 
        DateTime dateTo, 
        DateTime returnFrom, 
        DateTime returnTo, 
        int nightsInDstFrom,
        int nightsInDstTo,
        int maxFlyDuration,
        int adults,
        int children,
        int infants,
        decimal priceTo,
        decimal maxStopOvers,
        string currency,
        int limit);
}