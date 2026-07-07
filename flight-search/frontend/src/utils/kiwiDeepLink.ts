import type { LocaleCode } from '../config/locales';

/** Kiwi.com `lang` / path locale codes (Tequila API supported markets). */
const KIWI_LANG_BY_LOCALE: Record<LocaleCode, string> = {
  en: 'en',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pl: 'pl',
  nl: 'nl',
  ro: 'ro',
  tr: 'tr',
  pt: 'pt',
  cs: 'cz',
  hu: 'hu',
  el: 'el',
  sv: 'sv',
  uk: 'ua',
  ru: 'ru',
  bg: 'bg',
  da: 'da',
  fi: 'fi',
  sk: 'sk',
  no: 'no',
  lt: 'lt',
  lv: 'en',
  et: 'ee',
  is: 'is'
};

export function localizeKiwiDeepLink(deepLink: string | null, locale: LocaleCode): string | null {
  if (!deepLink) return null;

  try {
    const url = new URL(deepLink);
    if (!url.hostname.toLowerCase().includes('kiwi.com')) {
      return deepLink;
    }

    const kiwiLang = KIWI_LANG_BY_LOCALE[locale] ?? 'en';
    url.searchParams.set('lang', kiwiLang);

    const pathLocalePattern =
      /^\/(en|de|fr|es|it|pl|nl|ro|tr|pt|cz|cs|hu|el|sv|ua|uk|ru|bg|da|fi|sk|no|lt|ee|is|gb|us)(\/|$)/i;
    if (pathLocalePattern.test(url.pathname)) {
      url.pathname = url.pathname.replace(pathLocalePattern, `/${kiwiLang}$2`);
    }

    return url.toString();
  } catch {
    return deepLink;
  }
}
