import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useCityNameLoading } from '../hooks/useCityNameLoading';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocalizedLink, LocalizedNavLink } from './LocalizedLink';
import { SiteBrand } from './SiteBrand';
import './AppHeader.css';

export function AppHeader() {
  const { t } = useTranslation();
  const { busy } = useCityNameLoading();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main">
        <div className="container navbar-inner" ref={navRef}>
          <LocalizedLink className="brand" to="/">
            <SiteBrand />
          </LocalizedLink>

          <button
            type="button"
            className={`nav-menu-toggle${menuOpen ? ' nav-menu-toggle-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="site-nav-links"
            aria-label={t('nav.menu')}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="nav-menu-toggle-bars" aria-hidden="true" />
          </button>

          <div
            id="site-nav-links"
            className={`nav-links${menuOpen ? ' nav-links-open' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
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
