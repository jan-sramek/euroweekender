using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Flights_CityCodeFrom_UtcDeparture",
                table: "Flights",
                columns: new[] { "CityCodeFrom", "UtcDeparture" });

            migrationBuilder.CreateIndex(
                name: "IX_Flights_UtcDeparture",
                table: "Flights",
                column: "UtcDeparture");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Flights_CityCodeFrom_UtcDeparture",
                table: "Flights");

            migrationBuilder.DropIndex(
                name: "IX_Flights_UtcDeparture",
                table: "Flights");
        }
    }
}
