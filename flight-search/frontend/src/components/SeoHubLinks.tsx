import { useTranslation } from 'react-i18next';
import { SEO_HUB_CITIES } from '../data/seoHubCities';
import type { City } from '../types/city';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { weekendFlightsFromPath } from '../utils/citySlug';
import { findCityByCode } from '../services/locationPrefill';
import { LocalizedLink } from './LocalizedLink';

interface SeoHubLinksProps {
  allCities: City[];
  language: string;
  excludeCode?: string;
  limit?: number;
}

export function SeoHubLinks({
  allCities,
  language,
  excludeCode,
  limit = 12
}: SeoHubLinksProps) {
  const { t } = useTranslation();
  const excluded = excludeCode?.trim().toUpperCase();

  const hubs = SEO_HUB_CITIES.filter(hub => hub.code.toUpperCase() !== excluded).slice(
    0,
    limit
  );

  if (hubs.length === 0) return null;

  return (
    <nav className="home-hub-links" aria-label={t('weekendFlightsFrom.popularHubsTitle')}>
      <h3 className="home-hub-links-title">{t('weekendFlightsFrom.popularHubsTitle')}</h3>
      <ul className="home-hub-links-list">
        {hubs.map(hub => {
          const city = findCityByCode(allCities, hub.code) ?? hub;
          const label = getCityDisplayName(city, language);
          return (
            <li key={hub.code}>
              <LocalizedLink to={weekendFlightsFromPath(city)}>
                {t('weekendFlightsFrom.tagline', { city: label })}
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
