import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  DEFAULT_LOCALE,
  isLocaleCode,
  localizedPath,
  type LocaleCode
} from '../config/locales';

export function useLocale(): LocaleCode {
  const { lang } = useParams<{ lang: string }>();
  return isLocaleCode(lang) ? lang : DEFAULT_LOCALE;
}

export function useLocalizedPath() {
  const locale = useLocale();

  return useMemo(
    () => ({
      locale,
      path: (routePath = '/') => localizedPath(locale, routePath)
    }),
    [locale]
  );
}

export function useSyncDocumentLanguage() {
  const locale = useLocale();
  const { i18n } = useTranslation();

  if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}
