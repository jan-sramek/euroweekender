namespace WeekendFlights.Application.Services;

public static class TequilaLocaleMapper
{
    private static readonly Dictionary<string, string> LocaleMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "en-US",
        ["de"] = "de-DE",
        ["fr"] = "fr-FR",
        ["es"] = "es-ES",
        ["it"] = "it-IT",
        ["pl"] = "pl-PL",
        ["nl"] = "nl-NL",
        ["ro"] = "ro-RO",
        ["tr"] = "tr-TR",
        ["pt"] = "pt-PT",
        ["cs"] = "cs-CZ",
        ["hu"] = "hu-HU",
        ["el"] = "el-GR",
        ["sv"] = "sv-SE",
        ["uk"] = "uk-UA",
        ["ru"] = "ru-RU",
        ["bg"] = "bg-BG",
        ["da"] = "da-DK",
        ["fi"] = "fi-FI",
        ["sk"] = "sk-SK",
        ["no"] = "nb-NO",
        ["nb"] = "nb-NO",
        ["nn"] = "nb-NO",
        ["lt"] = "lt-LT",
        ["lv"] = "lv-LV",
        ["et"] = "et-EE",
        ["is"] = "is-IS"
    };

    public static string ToTequilaLocale(string? language)
    {
        if (string.IsNullOrWhiteSpace(language))
            return "en-US";

        var trimmed = language.Trim().Replace('_', '-');
        if (LocaleMap.TryGetValue(trimmed, out var exact))
            return exact;

        var baseLanguage = trimmed.Split('-', 2)[0];
        if (LocaleMap.TryGetValue(baseLanguage, out var mapped))
            return mapped;

        return trimmed.Contains('-', StringComparison.Ordinal) ? trimmed : "en-US";
    }
}
