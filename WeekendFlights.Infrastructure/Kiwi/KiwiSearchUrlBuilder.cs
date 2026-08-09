using System.Globalization;
using WeekendFlights.Application.Models;

namespace WeekendFlights.Infrastructure.Kiwi;

public static class KiwiSearchUrlBuilder
{
    public static string BuildSearchUrl(FlightSearchParameters parameters)
    {
        var query = new List<string>
        {
            $"fly_from={Uri.EscapeDataString(parameters.From)}",
            $"date_from={FormatDate(parameters.DateFrom)}",
            $"date_to={FormatDate(parameters.DateTo)}",
            "ret_from_diff_city=false",
            "ret_to_diff_city=false",
            $"max_fly_duration={parameters.MaxFlyDuration}",
            $"adults={parameters.Adults}",
            $"children={parameters.Children}",
            $"infants={parameters.Infants}",
            $"price_to={(int)parameters.PriceTo}",
            $"curr={parameters.Currency}",
            $"max_stopovers={(int)parameters.MaxStopOvers}",
            "sort=price",
            $"limit={parameters.Limit}"
        };

        if (parameters.ReturnFrom != default && parameters.ReturnTo != default)
        {
            query.Add($"return_from={FormatDate(parameters.ReturnFrom)}");
            query.Add($"return_to={FormatDate(parameters.ReturnTo)}");
        }
        else
        {
            query.Add($"nights_in_dst_from={parameters.NightsInDstFrom}");
            query.Add($"nights_in_dst_to={parameters.NightsInDstTo}");
        }

        if (parameters.DepartTimeFromHour is int dFrom)
            query.Add($"dtime_from={FormatHour(dFrom)}");
        if (parameters.DepartTimeToHour is int dTo)
            query.Add($"dtime_to={FormatHour(dTo)}");
        if (parameters.ReturnDepartTimeFromHour is int rFrom)
            query.Add($"ret_dtime_from={FormatHour(rFrom)}");
        if (parameters.ReturnDepartTimeToHour is int rTo)
            query.Add($"ret_dtime_to={FormatHour(rTo)}");

        return $"/v2/search?{string.Join("&", query)}";
    }

    private static string FormatDate(DateTime date) =>
        date.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

    private static string FormatHour(int hour) =>
        $"{Math.Clamp(hour, 0, 23):00}:00";
}
