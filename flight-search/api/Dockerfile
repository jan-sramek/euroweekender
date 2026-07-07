# Build context is the flight-search directory where docker-compose.yml lives
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project file and its dependencies directly to avoid path issues
COPY ../../../../../WeekendFlights.Api/WeekendFlights.Api.csproj .
COPY ../.. .

# Restore and build using absolute paths from /src
RUN dotnet restore "/src/WeekendFlights.Api/WeekendFlights.Api.csproj" && \
    dotnet build "/src/WeekendFlights.Api/WeekendFlights.Api.csproj" -c $BUILD_CONFIGURATION --no-restore -o /app/build

# Runtime stage - publish the application and base image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/build/. ./
ENTRYPOINT ["dotnet", "WeekendFlights.Api.dll"]