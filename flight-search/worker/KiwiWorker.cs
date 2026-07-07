// Copyright (c) Kiwi.com. All rights reserved.
// Licensed under the MIT License. See LICENSE in project root for details.

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Crawler.Services;

/// <summary>
/// Background worker service that periodically fetches weekend flight data from Kiwi API.
/// </summary>
public class KiwiWorker : BackgroundService
{
    private readonly ILogger<KiwiWorker> _logger;
    private readonly IKiwiApiClient _kiwiApiClient;
    private readonly TimeSpan _fetchInterval = TimeSpan.FromMinutes(30);

    public KiwiWorker(ILogger<KiwiWorker> logger, IKiwiApiClient kiwiApiClient)
    {
        _logger = logger;
        _kiwiApiClient = kiwiApiClient;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("KiwiWorker started. Will fetch flights every {Interval}.", _fetchInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await FetchFlights(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during flight fetch cycle");
            }

            await Task.Delay(_fetchInterval, stoppingToken);
        }

        _logger.LogInformation("KiwiWorker stopped.");
    }

    private async Task FetchFlights(CancellationToken cancellationToken)
    {
        try
        {
            // TODO: Implement actual flight fetching logic here
            // This would typically call the Kiwi API to search for weekend flights
            _logger.LogDebug("Fetching weekend flights...");
            
            // Example: await _kiwiApiClient.SearchWeekendFlightsAsync(...);
            
            _logger.LogInformation("Flight fetch completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching weekend flights");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogDebug("KiwiWorker stopping...");
        await base.StopAsync(cancellationToken);
    }
}