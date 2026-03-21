using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace WeekendFlights.Infrastructure.Persistence;

public class WeekendFlightsDbContextFactory : IDesignTimeDbContextFactory<WeekendFlightsDbContext>
{
    public WeekendFlightsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<WeekendFlightsDbContext>();

        // Build configuration from local.settings.json or environment
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory()) // folder of the Infrastructure project
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("local.settings.json", optional: true) // include local.settings for dev
            .AddEnvironmentVariables()
            .Build();

        // Read the connection string
        var connectionString = configuration["Values:DbConnectionString"];
        if (string.IsNullOrEmpty(connectionString))
            throw new InvalidOperationException("Connection string 'DbConnectionString' not found.");
        
        optionsBuilder.UseNpgsql(connectionString);
        return new WeekendFlightsDbContext(optionsBuilder.Options);
    }
} 