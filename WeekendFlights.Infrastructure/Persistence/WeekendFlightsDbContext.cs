using Microsoft.EntityFrameworkCore;
using WeekendFlights.Domain.Entities;

namespace WeekendFlights.Infrastructure.Persistence;

public class WeekendFlightsDbContext : DbContext
{
    public DbSet<City> Cities => Set<City>();
    public DbSet<Airport> Airports => Set<Airport>();
    public DbSet<Flight> Flights => Set<Flight>();
    
    public WeekendFlightsDbContext(DbContextOptions<WeekendFlightsDbContext> options)
        : base(options)
    {
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureCities(modelBuilder);
        ConfigureAirports(modelBuilder);
        ConfigureFlights(modelBuilder);
    }
    
    private static void ConfigureCities(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<City>(entity =>
        {
            entity.ToTable("cities");

            entity.HasKey(c => c.Id);

            entity.Property(c => c.KiwiId)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Code)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(c => c.Country)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.Region)
                .HasMaxLength(200);

            entity.Property(c => c.Continent)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(c => c.Latitude)
                .HasPrecision(9, 6);

            entity.Property(c => c.Longitude)
                .HasPrecision(9, 6);

            entity.Property(c => c.IsActive)
                .HasDefaultValue(false);

            entity.HasIndex(c => c.Code)
                .HasDatabaseName("idx_city_code");

            entity.HasIndex(c => new { c.Name, c.Country })
                .HasDatabaseName("idx_city_name_country");

            entity.HasIndex(c => c.KiwiId)
                .IsUnique()
                .HasDatabaseName("idx_city_kiwi_id");
        });
    }

    private static void ConfigureAirports(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Airport>(entity =>
        {
            entity.ToTable("airports");

            entity.HasKey(a => a.Id);

            entity.Property(a => a.KiwiId)
                .IsRequired();

            entity.Property(a => a.IataCode)
                .IsRequired()
                .HasMaxLength(3);

            entity.Property(a => a.IcaoCode)
                .HasMaxLength(4);

            entity.Property(a => a.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(a => a.TimeZone)
                .HasMaxLength(200);

            entity.Property(a => a.Latitude)
                .HasPrecision(9, 6);

            entity.Property(a => a.Longitude)
                .HasPrecision(9, 6);

            entity.Property(a => a.Rank);

            entity.Property(a => a.GlobalRankDestination);

            entity.Property(a => a.DestinationPopularityScore);

            entity.Property(a => a.IsActive)
                .HasDefaultValue(false);

            entity.HasIndex(a => a.IataCode)
                .IsUnique()
                .HasDatabaseName("idx_airport_iata");

            entity.HasIndex(a => a.KiwiId)
                .IsUnique()
                .HasDatabaseName("idx_airport_kiwi_id");

            entity.HasIndex(a => a.CityId)
                .HasDatabaseName("idx_airport_city");

            entity.HasOne(a => a.City)
                .WithMany(c => c.Airports)
                .HasForeignKey(a => a.CityId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureFlights(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Flight>(entity =>
    {
        // Table name
        entity.ToTable("Flights");

        // Primary key
        entity.HasKey(f => f.Id);

        // Properties
        entity.Property(f => f.KiwiId)
            .IsRequired()
            .HasMaxLength(200);

        entity.Property(f => f.BookingToken)
            .IsRequired()
            .HasMaxLength(2000);

        entity.Property(f => f.CountryFrom)
            .HasMaxLength(200);

        entity.Property(f => f.CountryTo)
            .HasMaxLength(200);

        entity.Property(f => f.DeepLink)
            .HasMaxLength(2000);

        entity.Property(f => f.Distance)
            .HasColumnType("float");

        entity.Property(f => f.DurationDeparture)
            .HasColumnType("decimal(5,2)");

        entity.Property(f => f.DurationReturn)
            .HasColumnType("decimal(5,2)");

        entity.Property(f => f.DurationTotal)
            .HasColumnType("decimal(5,2)");

        entity.Property(f => f.FareAdults)
            .HasColumnType("decimal(10,2)");

        entity.Property(f => f.FareChildern)
            .HasColumnType("decimal(10,2)");

        entity.Property(f => f.FareInfants)
            .HasColumnType("decimal(10,2)");

        entity.Property(f => f.LocalArrival)
            .HasColumnType("timestamp with time zone");

        entity.Property(f => f.LocalDeparture)
            .HasColumnType("timestamp with time zone");

        entity.Property(f => f.NightsInDest)
            .HasDefaultValue(0);

        entity.Property(f => f.Price)
            .HasColumnType("float");

        entity.Property(f => f.Quality)
            .HasColumnType("float");

        entity.Property(f => f.TechnicalStops)
            .HasDefaultValue(0);

        entity.Property(f => f.AvailabilitySeats)
            .HasDefaultValue(0);

        entity.Property(f => f.FlyTo)
            .HasMaxLength(10);

        entity.Property(f => f.FlyFrom)
            .HasMaxLength(10);

        entity.Property(f => f.CityFrom)
            .HasMaxLength(200);

        entity.Property(f => f.CityTo)
            .HasMaxLength(200);

        entity.Property(f => f.CityCodeFrom)
            .HasMaxLength(10);

        entity.Property(f => f.CityCodeTo)
            .HasMaxLength(10);

        entity.Property(f => f.UtcArrival)
            .HasColumnType("timestamp with time zone");

        entity.Property(f => f.UtcDeparture)
            .HasColumnType("timestamp with time zone");

        // Boolean defaults
        entity.Property(f => f.FacilitatedBookingAvailable).HasDefaultValue(false);
        entity.Property(f => f.HasAirportChange).HasDefaultValue(false);
        entity.Property(f => f.ThrowAwayTicketing).HasDefaultValue(false);
        entity.Property(f => f.HiddenCityTicketing).HasDefaultValue(false);
        entity.Property(f => f.VirtualInterlining).HasDefaultValue(false);

        // Indexes
        entity.HasIndex(f => f.KiwiId).IsUnique();
        entity.HasIndex(f => new { f.FlyFrom, f.FlyTo });
        entity.HasIndex(f => new { f.CityCodeFrom, f.CityCodeTo });
    });
}
}