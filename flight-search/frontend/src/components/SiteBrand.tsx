import { SITE_DOMAIN } from '../config/site';
import { SiteBrandMark } from './SiteBrandMark';
import './SiteBrand.css';

export function SiteBrand() {
  return (
    <span className="site-brand">
      <SiteBrandMark />
      <span className="site-brand-text" aria-hidden="true">
        <span className="site-brand-euro">euro</span>
        <span className="site-brand-weekend">weekend</span>
        <span className="site-brand-er">er</span>
        <span className="site-brand-tld">.com</span>
      </span>
      <span className="visually-hidden">{SITE_DOMAIN}</span>
    </span>
  );
}

export function SiteBrandAccessible() {
  return SITE_DOMAIN;
}
