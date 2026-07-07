import { Navigate } from 'react-router-dom';
import { detectBrowserLocale } from '../config/locales';

export function LocaleRedirect() {
  return <Navigate to={`/${detectBrowserLocale()}`} replace />;
}
