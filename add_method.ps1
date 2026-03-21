$content = Get-Content 'WeekendFlights.Infrastructure\Persistence\Repositories\LocationRepository.cs' -Raw
$newMethod = @'

    public async Task SaveAirports(List<Airport> airports)
    {
        if (airports == null || airports.Count == 0)
            return;

        // Get all unique city KiwiIds from the airports
        var cityKiwiIds = airports.Select(a => a.CityKiwiId).Distinct().ToList();
        
        // Find all cities by their KiwiIds
        var cities = await db.Cities
            .Where(c => cityKiwiIds.Contains(c.KiwiId))
            .ToDictionaryAsync(c => c.KiwiId, c => c);

        // Get existing airports by IataCode
        var airportIataCodes = airports.Select(a => a.IataCode).Distinct().ToList();
        var existingAirports = await db.Airports
            .Where(a => airportIataCodes.Contains(a.IataCode))
            .ToDictionaryAsync(a => a.IataCode, a => a);

        foreach (var airport in airports)
        {
            // Find the city for this airport
            if (!cities.TryGetValue(airport.CityKiwiId, out var city))
            {
                throw new ArgumentException($"City with KiwiId '{airport.CityKiwiId}' not found for airport '{airport.IataCode}'");
            }

            // Set the CityId foreign key
            airport.CityId = city.Id;

            // Check if airport already exists
            if (existingAirports.TryGetValue(airport.IataCode, out var existingAirport))
            {
                // Update existing airport
                existingAirport.IcaoCode = airport.IcaoCode;
                existingAirport.Name = airport.Name;
                existingAirport.TimeZone = airport.TimeZone;
                existingAirport.Latitude = airport.Latitude;
                existingAirport.Longitude = airport.Longitude;
                existingAirport.Rank = airport.Rank;
                existingAirport.GlobalRankDestination = airport.GlobalRankDestination;
                existingAirport.DestinationPopularityScore = airport.DestinationPopularityScore;
                existingAirport.CityId = city.Id;
                existingAirport.IsActive = airport.IsActive;
                
                db.Airports.Update(existingAirport);
            }
            else
            {
                // Add new airport
                db.Airports.Add(airport);
            }
        }

        await db.SaveChangesAsync();
    }
'@
$content = $content -replace '    }$', $newMethod
$content | Set-Content 'WeekendFlights.Infrastructure\Persistence\Repositories\LocationRepository.cs'
