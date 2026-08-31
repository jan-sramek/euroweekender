using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using WeekendFlights.Domain.Entities;

#nullable disable

namespace WeekendFlights.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSeoPageContents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "seo_page_contents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PageType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    OriginCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DestinationCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: ""),
                    Locale = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Lead = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Heading = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    MetaDescription = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    Paragraphs = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    Faq = table.Column<List<SeoFaqItem>>(type: "jsonb", nullable: false, defaultValueSql: "'[]'::jsonb"),
                    SourceUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SourceTitle = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    GeneratedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_seo_page_contents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "idx_seo_page_contents_lookup",
                table: "seo_page_contents",
                columns: new[] { "PageType", "OriginCode", "DestinationCode", "Locale" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "seo_page_contents");
        }
    }
}
