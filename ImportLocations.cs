using System;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace weekend_flights;

public class ImportLocations
{
    private readonly ILogger _logger;

    public ImportLocations(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<ImportLocations>();
    }

    [Function("ImportLocations")]
    public void Run([TimerTrigger("0 */5 * * * *")] TimerInfo myTimer)
    {
        _logger.LogInformation("C# Timer trigger function executed at: {executionTime}", DateTime.Now);
        
        if (myTimer.ScheduleStatus is not null)
        {
            _logger.LogInformation("Next timer schedule at: {nextSchedule}", myTimer.ScheduleStatus.Next);
        }
    }
}