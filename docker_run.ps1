docker run -d `
  -p 8080:8080 `
  -e ConnectionStrings__Postgres="Host=weekend-flights.postgres.database.azure.com;Port=5432;Database=weekend-flights;Username=jansramek;Password=1sIq2[B~AcS7" `
  weekendflights-api