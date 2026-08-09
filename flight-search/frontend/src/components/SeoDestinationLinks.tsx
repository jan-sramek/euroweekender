import { useTranslation } from 'react-i18next';
import { findCityByCode } from '../services/locationPrefill';
import type { City, OriginDestination } from '../types/city';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { weekendFlightsOdPath } from '../utils/citySlug';
import { LocalizedLink } from './LocalizedLink';

interface SeoDestinationLinksProps {
  fromCity: City;
  destinations: OriginDestination[];
  allCities: City[];
  language: string;
  limit?: number;
}

/** Popular-destinations links for a given origin city, used on weekend-flights-from pages. */
export function SeoDestinationLinks({
  fromCity,
  destinations,
  allCities,
  language,
  limit = 12
}: SeoDestinationLinksProps) {
  const { t } = useTranslation();
  const visible = destinations.slice(0, limit);

  if (visible.length === 0) return null;

  const cityLabel = getCityDisplayName(fromCity, language);
  const title = t('weekendFlightsFrom.topDestinationsTitle', { city: cityLabel });

  return (
    <nav className="home-hub-links" aria-label={title}>
      <h3 className="home-hub-links-title">{title}</h3>
      <ul className="home-hub-links-list">
        {visible.map(destination => {
          const city = findCityByCode(allCities, destination.code);
          const label = city ? getCityDisplayName(city, language) : destination.code;
          const to = city
            ? weekendFlightsOdPath(fromCity, city)
            : `/cheapest-weekend?from=${encodeURIComponent(fromCity.code)}&to=${encodeURIComponent(destination.code)}`;
          return (
            <li key={destination.code}>
              <LocalizedLink to={to}>
                {label}
                {destination.minPrice > 0
                  ? ` · ${t('weekendFlightsFrom.destinationPrice', { price: Math.round(destination.minPrice) })}`
                  : ''}
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
