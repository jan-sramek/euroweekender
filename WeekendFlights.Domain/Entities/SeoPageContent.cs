namespace WeekendFlights.Domain.Entities;

public static class SeoPageTypes
{
    public const string WeekendFrom = "weekend-from";
    public const string DayTripsFrom = "day-trips-from";
    public const string WeekendOd = "weekend-od";
}

public class SeoFaqItem
{
    public string Q { get; set; } = "";
    public string A { get; set; } = "";
}

/// <summary>
/// Pre-generated unique copy for a programmatic SEO landing, in one locale.
/// </summary>
public class SeoPageContent
{
    public Guid Id { get; set; }

    /// <summary>weekend-from, day-trips-from, or weekend-od.</summary>
    public string PageType { get; set; } = null!;

    public string OriginCode { get; set; } = null!;

    /// <summary>Destination IATA for OD pages; empty for origin-only pages.</summary>
    public string DestinationCode { get; set; } = "";

    public string Locale { get; set; } = null!;

    public string Lead { get; set; } = "";

    public string Heading { get; set; } = "";

    public string MetaDescription { get; set; } = "";

    public List<string> Paragraphs { get; set; } = [];

    public List<SeoFaqItem> Faq { get; set; } = [];

    public string? SourceUrl { get; set; }

    public string? SourceTitle { get; set; }

    public DateTimeOffset GeneratedAt { get; set; }
}
