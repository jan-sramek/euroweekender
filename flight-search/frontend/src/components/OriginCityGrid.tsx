import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { preferredIndexableLocale } from '../config/cityIndexLocales';
import { useLocale } from '../hooks/useLocale';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { weekendComparePath } from '../data/seoPopularRoutes';
import { withQuery, withWeekendCalendarHash } from '../utils/citySlug';
import { groupFlightsByOrigin } from '../utils/destinationGroups';
import { formatEur, getTripPrice } from '../utils/flightPrice';
import { weekendFlightsFocusParams } from '../utils/flightTime';
import { LocalizedLink } from './LocalizedLink';
import { CountryFlag } from './CountryFlag';
import './OriginCityGrid.css';

interface OriginCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

/** Compact origin list (no photo cards) for inbound destination hubs. */
export function OriginCityGrid({ flights, citiesByCode, passengerCount }: OriginCityGridProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const groups = useMemo(() => groupFlightsByOrigin(flights), [flights]);

  return (
    <ul className="origin-city-list">
      {groups.map(group => {
        const displayName = getCityNameByCode(
          citiesByCode,
          group.cityCode,
          locale,
          group.cityName
        );
        const from = citiesByCode.get(group.cityCode);
        const to = citiesByCode.get(group.toCode.trim().toUpperCase());
        const minPrice = getTripPrice(group.cheapestFlight, passengerCount);
        const priceLabel = formatEur(minPrice);
        const href = withWeekendCalendarHash(
          withQuery(
            from && to
              ? weekendComparePath(from, to)
              : `/cheapest-weekend?from=${encodeURIComponent(group.cityCode)}&to=${encodeURIComponent(group.toCode)}`,
            weekendFlightsFocusParams(group.cheapestFlight.localDeparture)
          )
        );

        return (
          <li key={group.cityCode}>
            <LocalizedLink
              className="origin-city-row"
              locale={
                from ? preferredIndexableLocale(locale, from.code, from.country) : undefined
              }
              to={href}
              data-umami-event="origin_city_compare_weekends"
              aria-label={t('home.cityCardAria', { city: displayName, price: priceLabel })}
            >
              <span className="origin-city-row-place">
                <CountryFlag country={group.country} />
                <span className="origin-city-row-name">{displayName}</span>
                <span className="origin-city-row-code">{group.cityCode}</span>
              </span>
              <span className="origin-city-row-meta">
                {t('home.cityOffers', { count: group.offerCount })}
              </span>
              <span className="origin-city-row-price">
                {t('weekendFlightsFrom.destinationPrice', { price: Math.round(minPrice) })}
              </span>
            </LocalizedLink>
          </li>
        );
      })}
    </ul>
  );
}
