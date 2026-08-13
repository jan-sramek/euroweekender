import { useTranslation } from 'react-i18next';
import { useCityNameLoading } from '../hooks/useCityNameLoading';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocalizedLink, LocalizedNavLink } from './LocalizedLink';
import { SiteBrand } from './SiteBrand';
import './AppHeader.css';

export function AppHeader() {
  const { t } = useTranslation();
  const { busy } = useCityNameLoading();

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main">
        <div className="container navbar-inner">
          <LocalizedLink className="brand" to="/">
            <SiteBrand />
          </LocalizedLink>

          <div className="nav-links">
            <LocalizedNavLink to="/" end>
              {t('nav.home')}
            </LocalizedNavLink>
            <LocalizedNavLink to="/cheapest-weekend">{t('nav.cheapestWeekend')}</LocalizedNavLink>
            <LocalizedNavLink to="/single-day-trips">{t('nav.singleDayTrips')}</LocalizedNavLink>
            <LocalizedNavLink to="/how-it-works">{t('nav.howItWorks')}</LocalizedNavLink>
            <LocalizedNavLink to="/about">{t('nav.about')}</LocalizedNavLink>
            <LocalizedNavLink to="/faq">{t('nav.faq')}</LocalizedNavLink>
            <LocalizedNavLink to="/contact">{t('nav.contact')}</LocalizedNavLink>
          </div>
          <LanguageSwitcher />
        </div>
      </nav>
      {busy ? (
        <div className="site-header-progress" role="progressbar" aria-label={t('common.changingLanguage')} />
      ) : null}
    </header>
  );
}
