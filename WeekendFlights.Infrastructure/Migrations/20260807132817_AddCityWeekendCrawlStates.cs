using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCityWeekendCrawlStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "city_weekend_crawl_states",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CityCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    WeekendStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastCrawledUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastOfferCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_city_weekend_crawl_states", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_city_weekend_crawl_states_city_weekend",
                table: "city_weekend_crawl_states",
                columns: new[] { "CityCode", "WeekendStart" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_city_weekend_crawl_states_weekend_start",
                table: "city_weekend_crawl_states",
                column: "WeekendStart");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "city_weekend_crawl_states");
        }
    }
}
