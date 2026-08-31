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
    bool IsActive,
    IReadOnlyList<string> Aliases,
    IReadOnlyDictionary<string, string> NamesByLocale);

/// <summary>
/// City suggestion that may include a localized display name from Tequila.
/// </summary>
public record CitySuggestDto(
    Guid Id,
    string Code,
    string Name,
    string Country,
    string? Region,
    string Continent,
    decimal Latitude,
    decimal Longitude,
    bool IsActive,
    IReadOnlyList<string> Aliases,
    IReadOnlyDictionary<string, string> NamesByLocale,
    string LocalizedName);

public record OriginHubScoreDto(
    string Code,
    int OfferCount,
    double MinPrice,
    double AverageQuality,
    int DestinationCount,
    double HubScore);

public record OriginDestinationDto(
    string Code,
    int OfferCount,
    double MinPrice,
    int CheapOfferCount);

public record IpGeoPositionDto(double Latitude, double Longitude);

public record FlightSearchDto(
    int Id,
    string CountryTo,
    string CountryFrom,
    string? DeepLink,
    decimal FareAdults,
    int NightsInDest,
    double Price,
    int TechnicalStops,
    int TechnicalStopsReturn,
    decimal DurationDeparture,
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

public record SeoFaqDto(string Q, string A);

public record SeoPageContentDto(
    string PageType,
    string OriginCode,
    string DestinationCode,
    string Locale,
    string Lead,
    string Heading,
    string MetaDescription,
    IReadOnlyList<string> Paragraphs,
    IReadOnlyList<SeoFaqDto> Faq,
    string? SourceUrl,
    string? SourceTitle,
    DateTimeOffset GeneratedAt);

public record SeoPageContentSnapshotDto(
    DateTimeOffset GeneratedAt,
    int PageCount,
    IReadOnlyDictionary<string, SeoPageContentDto> Pages);
