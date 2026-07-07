FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["WeekendFlights.Api/WeekendFlights.Api.csproj", "WeekendFlights.Api/"]
COPY ["WeekendFlights.Infrastructure/WeekendFlights.Infrastructure.csproj", "WeekendFlights.Infrastructure/"]
COPY ["WeekendFlights.Application/WeekendFlights.Application.csproj", "WeekendFlights.Application/"]
COPY ["WeekendFlights.Domain/WeekendFlights.Domain.csproj", "WeekendFlights.Domain/"]
RUN dotnet restore "WeekendFlights.Api/WeekendFlights.Api.csproj"
COPY . .
WORKDIR "/src/WeekendFlights.Api"
RUN dotnet build "WeekendFlights.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "WeekendFlights.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WeekendFlights.Api.dll"]