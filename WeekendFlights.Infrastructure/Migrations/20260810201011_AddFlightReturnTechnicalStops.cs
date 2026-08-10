using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFlightReturnTechnicalStops : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TechnicalStopsReturn",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TechnicalStopsReturn",
                table: "Flights");
        }
    }
}
