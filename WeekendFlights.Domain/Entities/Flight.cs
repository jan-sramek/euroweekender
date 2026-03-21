namespace WeekendFlights.Domain.Entities;

public class Flight
{
    public int Id { get; set; }
    public string KiwiId { get; set; }
    // public List<string> Airlines { get; set; }
    // public BagLimitDto Baglimit { get; set; }
    // public BagsPriceDto BagsPrice { get; set; }
    public string BookingToken { get; set; }
    // public ConversionDto Conversion { get; set; }
    public string CountryFrom { get; set; }
    public string CountryTo { get; set; }
    public string? DeepLink { get; set; }
    public double Distance { get; set; }
    public decimal DurationDeparture { get; set; }
    public decimal DurationReturn { get; set; }
    public decimal DurationTotal { get; set; }
    public bool FacilitatedBookingAvailable { get; set; }
    public decimal FareAdults { get; set; }
    public decimal FareChildern { get; set; }
    public decimal FareInfants { get; set; }

    public bool HasAirportChange { get; set; }
    // public List<string> Hashtags { get; set; }
    
    public DateTime LocalArrival { get; set; }
    public DateTime LocalDeparture { get; set; }
    
    public int NightsInDest { get; set; }

    public int PnrCount { get; set; }
    public double Price { get; set; }
    public double Quality { get; set; }
    // public List<RouteDto> Route { get; set; }
    public int TechnicalStops { get; set; }
    public bool ThrowAwayTicketing { get; set; }
    public bool HiddenCityTicketing { get; set; }
    public int? AvailabilitySeats { get; set; }
    public bool VirtualInterlining { get; set; }
    public string FlyTo { get; set; }
    public string FlyFrom { get; set; }
    public string CityFrom { get; set; }
    public string CityTo { get; set; }
    public string CityCodeFrom { get; set; }
    public string CityCodeTo { get; set; }
    public DateTime UtcArrival { get; set; }
    public DateTime UtcDeparture { get; set; }
}
