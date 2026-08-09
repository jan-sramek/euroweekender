using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using WeekendFlights.Api.Middleware;
using WeekendFlights.Infrastructure;
using WeekendFlights.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["application/json"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHealthChecks()
    .AddDbContextCheck<WeekendFlightsDbContext>("database");

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost:4201"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WeekendFlightsDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseStartup");

    try
    {
        // Ensure column exists before EF tries AddColumn. Brace doubling is required because
        // ExecuteSqlRaw treats single { } as String.Format placeholders.
        await db.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE IF EXISTS cities
            ADD COLUMN IF NOT EXISTS "NamesByLocale" jsonb NOT NULL DEFAULT '{{}}'::jsonb;
            """);

        try
        {
            await db.Database.MigrateAsync();
        }
        catch (Exception migrateEx) when (IsDuplicateNamesByLocaleColumn(migrateEx))
        {
            logger.LogWarning(
                migrateEx,
                "NamesByLocale already present; stamping EF history and retrying migrations");

            await db.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
                SELECT '20260808173446_AddCityNamesByLocale', '10.0.0'
                WHERE NOT EXISTS (
                  SELECT 1 FROM "__EFMigrationsHistory"
                  WHERE "MigrationId" = '20260808173446_AddCityNamesByLocale'
                );
                """);

            await db.Database.MigrateAsync();
        }
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "Database migration failed during API startup");
        throw;
    }
}

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

static bool IsDuplicateNamesByLocaleColumn(Exception ex)
{
    for (var current = ex; current is not null; current = current.InnerException)
    {
        var message = current.Message;
        if (message.Contains("NamesByLocale", StringComparison.OrdinalIgnoreCase)
            && (message.Contains("already exists", StringComparison.OrdinalIgnoreCase)
                || message.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
                || message.Contains("42701", StringComparison.Ordinal)))
        {
            return true;
        }
    }

    return false;
}
