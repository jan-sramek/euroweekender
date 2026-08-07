export const DEFAULT_LOCALE = 'en';

/** Ordered by approximate European usage (speakers + travel market reach). English stays first as default. */
export const LOCALES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flagCode: 'gb' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flagCode: 'de' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flagCode: 'fr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flagCode: 'es' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flagCode: 'it' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flagCode: 'pl' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flagCode: 'nl' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Română', flagCode: 'ro' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flagCode: 'tr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flagCode: 'pt' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština', flagCode: 'cz' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar', flagCode: 'hu' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', flagCode: 'gr' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flagCode: 'se' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flagCode: 'ua' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flagCode: 'ru' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български', flagCode: 'bg' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk', flagCode: 'dk' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi', flagCode: 'fi' },
  { code: 'sk', label: 'Slovak', nativeLabel: 'Slovenčina', flagCode: 'sk' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk', flagCode: 'no' },
  { code: 'lt', label: 'Lithuanian', nativeLabel: 'Lietuvių', flagCode: 'lt' },
  { code: 'lv', label: 'Latvian', nativeLabel: 'Latviešu', flagCode: 'lv' },
  { code: 'et', label: 'Estonian', nativeLabel: 'Eesti', flagCode: 'ee' },
  { code: 'is', label: 'Icelandic', nativeLabel: 'Íslenska', flagCode: 'is' }
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const LOCALE_CODES = LOCALES.map(locale => locale.code);

const LOCALE_ALIASES: Record<string, LocaleCode> = {
  nb: 'no',
  nn: 'no'
};

export function isLocaleCode(value: string | undefined): value is LocaleCode {
  return LOCALE_CODES.includes(value as LocaleCode);
}

export function detectBrowserLocale(): LocaleCode {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isLocaleCode(base)) return base;
    const alias = LOCALE_ALIASES[base];
    if (alias) return alias;
  }

  return DEFAULT_LOCALE;
}

export function localizedPath(locale: LocaleCode, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return `/${locale}`;
  return `/${locale}${normalized}`;
}
