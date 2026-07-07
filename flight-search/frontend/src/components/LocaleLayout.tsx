import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LOCALE, isLocaleCode } from '../config/locales';

export function LocaleLayout() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (isLocaleCode(lang) && i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
    if (isLocaleCode(lang)) {
      document.documentElement.lang = lang;
    }
  }, [lang, i18n]);

  if (!isLocaleCode(lang)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  }

  return <Outlet />;
}
