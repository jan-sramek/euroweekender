using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightsImportTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "flights_imports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DateTimeUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastCityCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_flights_imports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_flights_imports_datetime",
                table: "flights_imports",
                column: "DateTimeUtc");

            migrationBuilder.CreateIndex(
                name: "idx_flights_imports_last_city_code",
                table: "flights_imports",
                column: "LastCityCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "flights_imports");
        }
    }
}
