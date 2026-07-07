using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightReturnLocalTimes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LocalReturnArrival",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LocalReturnDeparture",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocalReturnArrival",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "LocalReturnDeparture",
                table: "Flights");
        }
    }
}
