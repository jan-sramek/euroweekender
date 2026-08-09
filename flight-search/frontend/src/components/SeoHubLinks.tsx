import { useTranslation } from 'react-i18next';
import { SEO_HUB_CITIES } from '../data/seoHubCities';
import type { City } from '../types/city';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { dayTripsFromPath, weekendFlightsFromPath } from '../utils/citySlug';
import { findCityByCode } from '../services/locationPrefill';
import { LocalizedLink } from './LocalizedLink';

interface SeoHubLinksProps {
  allCities: City[];
  language: string;
  excludeCode?: string;
  limit?: number;
  /** Which tool the hub links point to. Defaults to weekend flights. */
  variant?: 'weekend' | 'dayTrips';
}

export function SeoHubLinks({
  allCities,
  language,
  excludeCode,
  limit = 12,
  variant = 'weekend'
}: SeoHubLinksProps) {
  const { t } = useTranslation();
  const excluded = excludeCode?.trim().toUpperCase();

  const hubs = SEO_HUB_CITIES.filter(hub => hub.code.toUpperCase() !== excluded).slice(
    0,
    limit
  );

  if (hubs.length === 0) return null;

  const isDayTrips = variant === 'dayTrips';
  const titleKey = isDayTrips ? 'dayTripsFrom.popularHubsTitle' : 'weekendFlightsFrom.popularHubsTitle';
  const linkLabelKey = isDayTrips ? 'dayTripsFrom.tagline' : 'weekendFlightsFrom.tagline';
  const buildPath = isDayTrips ? dayTripsFromPath : weekendFlightsFromPath;

  return (
    <nav className="home-hub-links" aria-label={t(titleKey)}>
      <h3 className="home-hub-links-title">{t(titleKey)}</h3>
      <ul className="home-hub-links-list">
        {hubs.map(hub => {
          const city = findCityByCode(allCities, hub.code) ?? hub;
          const label = getCityDisplayName(city, language);
          return (
            <li key={hub.code}>
              <LocalizedLink to={buildPath(city)}>{t(linkLabelKey, { city: label })}</LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
