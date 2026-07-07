import { useTranslation } from 'react-i18next';
import { LocalizedLink } from './LocalizedLink';
import { SiteBrand } from './SiteBrand';
import './SiteFooter.css';

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <LocalizedLink className="brand" to="/">
            <SiteBrand />
          </LocalizedLink>
          <p className="footer-tagline">{t('footer.tagline')}</p>
        </div>

        <div className="footer-links-block">
          <h2 className="footer-heading">{t('footer.explore')}</h2>
          <ul className="footer-links">
            <li>
              <LocalizedLink to="/">{t('footer.searchFlights')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to="/how-it-works">{t('nav.howItWorks')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to="/about">{t('nav.about')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to="/faq">{t('nav.faq')}</LocalizedLink>
            </li>
          </ul>
        </div>

        <div className="footer-links-block">
          <h2 className="footer-heading">{t('footer.support')}</h2>
          <ul className="footer-links">
            <li>
              <LocalizedLink to="/contact">{t('nav.contact')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to="/privacy">{t('footer.privacy')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to="/terms">{t('footer.terms')}</LocalizedLink>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="copyright">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
