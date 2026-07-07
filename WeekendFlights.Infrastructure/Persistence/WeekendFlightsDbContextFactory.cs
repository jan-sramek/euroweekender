using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace WeekendFlights.Infrastructure.Persistence;

public class WeekendFlightsDbContextFactory : IDesignTimeDbContextFactory<WeekendFlightsDbContext>
{
    public WeekendFlightsDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../WeekendFlights.Api"))
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = GetConnectionString(args, configuration)
            ?? throw new InvalidOperationException(
                "Connection string not found. Set ConnectionStrings__Postgres or pass --connection.");

        var optionsBuilder = new DbContextOptionsBuilder<WeekendFlightsDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new WeekendFlightsDbContext(optionsBuilder.Options);
    }

    private static string? GetConnectionString(string[] args, IConfiguration configuration)
    {
        var connectionArgIndex = Array.IndexOf(args, "--connection");
        if (connectionArgIndex >= 0 && connectionArgIndex + 1 < args.Length)
            return args[connectionArgIndex + 1];

        return configuration.GetConnectionString("Postgres")
            ?? configuration["ConnectionStrings:DefaultConnection"]
            ?? configuration["DbConnectionString"];
    }
}
