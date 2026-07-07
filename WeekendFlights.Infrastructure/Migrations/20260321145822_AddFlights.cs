using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Flights",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    KiwiId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BookingToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CountryFrom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CountryTo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DeepLink = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Distance = table.Column<double>(type: "float", nullable: false),
                    DurationDeparture = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    DurationReturn = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    DurationTotal = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    FacilitatedBookingAvailable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FareAdults = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    FareChildern = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    FareInfants = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    HasAirportChange = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LocalArrival = table.Column<DateTime>(type: "timestamp", nullable: false),
                    LocalDeparture = table.Column<DateTime>(type: "timestamp", nullable: false),
                    NightsInDest = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    PnrCount = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<double>(type: "float", nullable: false),
                    Quality = table.Column<double>(type: "float", nullable: false),
                    TechnicalStops = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ThrowAwayTicketing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    HiddenCityTicketing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    AvailabilitySeats = table.Column<int>(type: "integer", nullable: true, defaultValue: 0),
                    VirtualInterlining = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FlyTo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FlyFrom = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CityFrom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CityTo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CityCodeFrom = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CityCodeTo = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    UtcArrival = table.Column<DateTime>(type: "timestamp", nullable: false),
                    UtcDeparture = table.Column<DateTime>(type: "timestamp", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Flights", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Flights_CityCodeFrom_CityCodeTo",
                table: "Flights",
                columns: new[] { "CityCodeFrom", "CityCodeTo" });

            migrationBuilder.CreateIndex(
                name: "IX_Flights_FlyFrom_FlyTo",
                table: "Flights",
                columns: new[] { "FlyFrom", "FlyTo" });

            migrationBuilder.CreateIndex(
                name: "IX_Flights_KiwiId",
                table: "Flights",
                column: "KiwiId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Flights");
        }
    }
}
