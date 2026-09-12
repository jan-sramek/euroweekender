using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightCityCodeToUtcDepartureIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Large Flights table: a normal CREATE INDEX blocks writes and can exceed the
            // default 30s command timeout, crashing API startup. CONCURRENTLY cannot run
            // inside a transaction.
            migrationBuilder.Sql(
                """
                DROP INDEX CONCURRENTLY IF EXISTS "IX_Flights_CityCodeTo_UtcDeparture";
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY "IX_Flights_CityCodeTo_UtcDeparture"
                ON "Flights" ("CityCodeTo", "UtcDeparture");
                """,
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX CONCURRENTLY IF EXISTS "IX_Flights_CityCodeTo_UtcDeparture";
                """,
                suppressTransaction: true);
        }
    }
}
