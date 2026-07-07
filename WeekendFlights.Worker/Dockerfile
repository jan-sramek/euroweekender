FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY WeekendFlights.Domain/WeekendFlights.Domain.csproj WeekendFlights.Domain/
COPY WeekendFlights.Application/WeekendFlights.Application.csproj WeekendFlights.Application/
COPY WeekendFlights.Infrastructure/WeekendFlights.Infrastructure.csproj WeekendFlights.Infrastructure/
COPY WeekendFlights.Worker/WeekendFlights.Worker.csproj WeekendFlights.Worker/

RUN dotnet restore WeekendFlights.Worker/WeekendFlights.Worker.csproj

COPY . .

RUN dotnet publish WeekendFlights.Worker/WeekendFlights.Worker.csproj -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WeekendFlights.Worker.dll"]
