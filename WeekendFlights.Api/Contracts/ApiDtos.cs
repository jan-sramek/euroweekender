namespace WeekendFlights.Api.Contracts;

public record CityDto(
    Guid Id,
    string Code,
    string Name,
    string Country,
    string? Region,
    string Continent,
    decimal Latitude,
    decimal Longitude,
    bool IsActive);

public record OriginHubScoreDto(
    string Code,
    int OfferCount,
    double MinPrice,
    double AverageQuality,
    int DestinationCount,
    double HubScore);

public record FlightDto(
    int Id,
    string KiwiId,
    string CountryFrom,
    string CountryTo,
    string? DeepLink,
    double Distance,
    decimal DurationDeparture,
    decimal DurationReturn,
    decimal DurationTotal,
    bool FacilitatedBookingAvailable,
    decimal FareAdults,
    int NightsInDest,
    double Price,
    double Quality,
    int TechnicalStops,
    string FlyTo,
    string FlyFrom,
    string CityFrom,
    string CityTo,
    string CityCodeFrom,
    string CityCodeTo,
    DateTime LocalArrival,
    DateTime LocalDeparture,
    DateTime? LocalReturnDeparture,
    DateTime? LocalReturnArrival,
    DateTime UtcArrival,
    DateTime UtcDeparture,
    int? AvailabilitySeats);

public record PagedFlightsDto(
    IReadOnlyList<FlightDto> Items,
    int TotalCount,
    int Page,
    int PageSize);
