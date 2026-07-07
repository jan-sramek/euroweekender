export const DEFAULT_LOCALE = 'en';

/** Ordered by approximate European usage (speakers + travel market reach). English stays first as default. */
export const LOCALES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { code: 'ro', label: 'Romanian', nativeLabel: 'Română', flag: '🇷🇴' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', label: 'Hungarian', nativeLabel: 'Magyar', flag: '🇭🇺' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'bg', label: 'Bulgarian', nativeLabel: 'Български', flag: '🇧🇬' },
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi', flag: '🇫🇮' },
  { code: 'sk', label: 'Slovak', nativeLabel: 'Slovenčina', flag: '🇸🇰' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk', flag: '🇳🇴' },
  { code: 'lt', label: 'Lithuanian', nativeLabel: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', label: 'Latvian', nativeLabel: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', label: 'Estonian', nativeLabel: 'Eesti', flag: '🇪🇪' },
  { code: 'is', label: 'Icelandic', nativeLabel: 'Íslenska', flag: '🇮🇸' }
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
