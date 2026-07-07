import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocalizedLink, LocalizedNavLink } from './LocalizedLink';
import { SiteBrand } from './SiteBrand';
import './AppHeader.css';

export function AppHeader() {
  const { t } = useTranslation();

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
            <LocalizedNavLink to="/how-it-works">{t('nav.howItWorks')}</LocalizedNavLink>
            <LocalizedNavLink to="/about">{t('nav.about')}</LocalizedNavLink>
            <LocalizedNavLink to="/faq">{t('nav.faq')}</LocalizedNavLink>
            <LocalizedNavLink to="/contact">{t('nav.contact')}</LocalizedNavLink>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>
    </header>
  );
}
