FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY WeekendFlights.Domain/WeekendFlights.Domain.csproj WeekendFlights.Domain/
COPY WeekendFlights.Application/WeekendFlights.Application.csproj WeekendFlights.Application/
COPY WeekendFlights.Infrastructure/WeekendFlights.Infrastructure.csproj WeekendFlights.Infrastructure/
COPY WeekendFlights.Api/WeekendFlights.Api.csproj WeekendFlights.Api/

RUN dotnet restore WeekendFlights.Api/WeekendFlights.Api.csproj

COPY . .

RUN dotnet publish WeekendFlights.Api/WeekendFlights.Api.csproj -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "WeekendFlights.Api.dll"]
