using WeekendFlights.Application;
using WeekendFlights.Application.Services;
using WeekendFlights.Application.Services.Jobs;
using WeekendFlights.Infrastructure;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddWorkerJobs();

var command = args.FirstOrDefault()?.ToLowerInvariant();

if (command is "crawl" or "import-locations" or "cleanup" or "backfill-return-times")
{
    var host = builder.Build();

    using var scope = host.Services.CreateScope();
    var cancellationToken = host.Services.GetRequiredService<IHostApplicationLifetime>().ApplicationStopping;

    switch (command)
    {
        case "crawl":
            await scope.ServiceProvider.GetRequiredService<WeekendFlightCrawlJob>().RunAsync(cancellationToken);
            break;
        case "import-locations":
            await scope.ServiceProvider.GetRequiredService<LocationImportJob>().RunAsync(cancellationToken);
            break;
        case "cleanup":
            await scope.ServiceProvider.GetRequiredService<OldFlightsCleanupJob>().RunAsync(cancellationToken);
            break;
        case "backfill-return-times":
            await scope.ServiceProvider
                .GetRequiredService<FlightReturnTimesBackfillJob>()
                .RunAsync(args.ElementAtOrDefault(1), cancellationToken);
            break;
    }

    return;
}

builder.Services.AddHostedService<WeekendFlightCrawlerBackgroundService>();
builder.Services.AddHostedService<RemoveOldFlightsBackgroundService>();
builder.Services.AddHostedService<LocationImportBackgroundService>();

await builder.Build().RunAsync();
