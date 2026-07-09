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

public record FlightSearchDto(
    int Id,
    string CountryTo,
    string? DeepLink,
    decimal FareAdults,
    int NightsInDest,
    double Price,
    int TechnicalStops,
    decimal DurationReturn,
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
    int? AvailabilitySeats);

public record PagedFlightsDto(
    IReadOnlyList<FlightSearchDto> Items,
    int TotalCount,
    int Page,
    int PageSize);
