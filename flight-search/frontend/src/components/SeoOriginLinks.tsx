import { useTranslation } from 'react-i18next';
import { preferredIndexableLocale } from '../config/cityIndexLocales';
import { useLocale } from '../hooks/useLocale';
import { findCityByCode } from '../services/locationPrefill';
import type { City, OriginDestination } from '../types/city';
import { isPrerenderedOdPair, weekendComparePath } from '../data/seoPopularRoutes';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { LocalizedLink } from './LocalizedLink';

interface SeoOriginLinksProps {
  toCity: City;
  origins: OriginDestination[];
  allCities: City[];
  language: string;
  limit?: number;
}

/** Popular-origin links into a destination city, used on weekend-flights-to pages. */
export function SeoOriginLinks({
  toCity,
  origins,
  allCities,
  language,
  limit = 12
}: SeoOriginLinksProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const ranked = [
    ...origins.filter(origin => isPrerenderedOdPair(origin.code, toCity.code)),
    ...origins.filter(origin => !isPrerenderedOdPair(origin.code, toCity.code))
  ];
  const visible = ranked.slice(0, limit);

  if (visible.length === 0) return null;

  const cityLabel = getCityDisplayName(toCity, language);
  const title = t('weekendFlightsTo.topOriginsTitle', { city: cityLabel });

  return (
    <nav className="home-hub-links" aria-label={title}>
      <h3 className="home-hub-links-title">{title}</h3>
      <ul className="home-hub-links-list">
        {visible.map(origin => {
          const city = findCityByCode(allCities, origin.code);
          const label = city ? getCityDisplayName(city, language) : origin.code;
          const to = city
            ? weekendComparePath(city, toCity)
            : `/cheapest-weekend?from=${encodeURIComponent(origin.code)}&to=${encodeURIComponent(toCity.code)}`;
          return (
            <li key={origin.code}>
              <LocalizedLink
                locale={
                  city
                    ? preferredIndexableLocale(locale, city.code, city.country)
                    : preferredIndexableLocale(locale, toCity.code, toCity.country)
                }
                to={to}
              >
                {label}
                {origin.minPrice > 0
                  ? ` · ${t('weekendFlightsFrom.destinationPrice', { price: Math.round(origin.minPrice) })}`
                  : ''}
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
