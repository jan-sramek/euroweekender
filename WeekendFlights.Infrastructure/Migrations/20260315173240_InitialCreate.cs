using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KiwiId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Continent = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "airports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    KiwiId = table.Column<int>(type: "integer", nullable: false),
                    IataCode = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    IcaoCode = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    TimeZone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    Longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    Rank = table.Column<int>(type: "integer", nullable: false),
                    GlobalRankDestination = table.Column<int>(type: "integer", nullable: false),
                    DestinationPopularityScore = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_airports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_airports_cities_CityId",
                        column: x => x.CityId,
                        principalTable: "cities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_airport_city",
                table: "airports",
                column: "CityId");

            migrationBuilder.CreateIndex(
                name: "idx_airport_iata",
                table: "airports",
                column: "IataCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_airport_kiwi_id",
                table: "airports",
                column: "KiwiId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_city_code",
                table: "cities",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "idx_city_kiwi_id",
                table: "cities",
                column: "KiwiId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_city_name_country",
                table: "cities",
                columns: new[] { "Name", "Country" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "airports");

            migrationBuilder.DropTable(
                name: "cities");
        }
    }
}
