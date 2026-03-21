using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WeekendFlights.Application.Interfaces;

namespace WeekendFlights.Crawler;

public class ImportLocations
{
    private readonly ILogger _logger;
    private readonly ILocationImportService _service;
    private readonly string _apiKey;

    public ImportLocations(ILoggerFactory loggerFactory, ILocationImportService service, IConfiguration configuration)
    {
        _logger = loggerFactory.CreateLogger<ImportLocations>();
        _service = service;
        _apiKey = configuration["KiwiApiKey"] ?? throw new ArgumentNullException("KiwiApiKey not found in configuration");
    }

    [Function("ImportLocations")]
    public async Task Run([TimerTrigger("0 0 1 1 *")] TimerInfo myTimer)
    {
        await RunCore();
        if (myTimer.ScheduleStatus is not null)
        {
            _logger.LogInformation("Next timer schedule at: {nextSchedule}", myTimer.ScheduleStatus.Next);
        }
    }
    
    [Function("ImportLocationsManual")]
    public async Task RunManual(
        [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
    {
        await RunCore();
    }
    
    public async Task RunCore()
    {
        _logger.LogInformation("C# Timer trigger function executed at: {executionTime}", DateTime.Now);
        
        await _service.ImportLocationsAsync(_apiKey);
    }
}