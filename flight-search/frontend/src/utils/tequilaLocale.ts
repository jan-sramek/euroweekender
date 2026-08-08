/** Map app UI language codes to Tequila locale ids used in city name dumps. */
const TEQUILA_LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pl: 'pl-PL',
  nl: 'nl-NL',
  ro: 'ro-RO',
  tr: 'tr-TR',
  pt: 'pt-PT',
  cs: 'cs-CZ',
  hu: 'hu-HU',
  el: 'el-GR',
  sv: 'sv-SE',
  uk: 'uk-UA',
  ru: 'ru-RU',
  bg: 'bg-BG',
  da: 'da-DK',
  fi: 'fi-FI',
  sk: 'sk-SK',
  no: 'nb-NO',
  nb: 'nb-NO',
  nn: 'nb-NO',
  lt: 'lt-LT',
  lv: 'lv-LV',
  et: 'et-EE',
  is: 'is-IS'
};

export function toTequilaLocale(language: string | undefined): string {
  if (!language) return 'en-US';
  const trimmed = language.trim().replace('_', '-');
  if (TEQUILA_LOCALE_BY_LANGUAGE[trimmed]) return TEQUILA_LOCALE_BY_LANGUAGE[trimmed];

  const base = trimmed.split('-')[0]?.toLowerCase() ?? 'en';
  return TEQUILA_LOCALE_BY_LANGUAGE[base] ?? 'en-US';
}
