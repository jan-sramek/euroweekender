import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { preferredIndexableLocale } from '../config/cityIndexLocales';
import { useLocale } from '../hooks/useLocale';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { weekendComparePath } from '../data/seoPopularRoutes';
import { withQuery, withWeekendCalendarHash } from '../utils/citySlug';
import { groupFlightsByDestination, groupFlightsByOrigin } from '../utils/destinationGroups';
import { formatEur, getTripPrice } from '../utils/flightPrice';
import { weekendFlightsFocusParams } from '../utils/flightTime';
import { LocalizedLink } from './LocalizedLink';
import { CountryFlag } from './CountryFlag';
import type { FlightsNavState } from './ResultsBackLink';
import './CityGroupedFlightsView.css';

export type { FlightsNavState };

interface CityGroupedFlightsViewProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
  /** Inbound hubs group by origin; outbound hubs group by destination. */
  mode: 'origin' | 'destination';
}

/** Cities view: one row per city; click opens the compare-weekends flights page. */
export function CityGroupedFlightsView({
  flights,
  citiesByCode,
  passengerCount,
  mode
}: CityGroupedFlightsViewProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const location = useLocation();

  const groups = useMemo(
    () => (mode === 'origin' ? groupFlightsByOrigin(flights) : groupFlightsByDestination(flights)),
    [flights, mode]
  );

  const backState = useMemo((): FlightsNavState => {
    const backTo = `${location.pathname}${location.search}${location.hash}`;
    return {
      backTo,
      backLabel: t('home.backToResults')
    };
  }, [location.pathname, location.search, location.hash, t]);

  if (groups.length === 0) return null;

  return (
    <ul className="city-grouped-flights">
      {groups.map(group => {
        const displayName = getCityNameByCode(
          citiesByCode,
          group.cityCode,
          locale,
          group.cityName
        );
        const fromCode =
          mode === 'origin'
            ? group.cityCode
            : group.cheapestFlight.cityCodeFrom.trim().toUpperCase();
        const toCode =
          mode === 'origin'
            ? group.cheapestFlight.cityCodeTo.trim().toUpperCase()
            : group.cityCode;
        const from = citiesByCode.get(fromCode);
        const to = citiesByCode.get(toCode);
        const minPrice = getTripPrice(group.cheapestFlight, passengerCount);
        const priceLabel = formatEur(minPrice);
        const href = withWeekendCalendarHash(
          withQuery(
            from && to
              ? weekendComparePath(from, to)
              : `/cheapest-weekend?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`,
            weekendFlightsFocusParams(group.cheapestFlight.localDeparture)
          )
        );

        return (
          <li key={group.cityCode} className="city-grouped-item">
            <LocalizedLink
              className="city-grouped-row"
              locale={
                from ? preferredIndexableLocale(locale, from.code, from.country) : undefined
              }
              to={href}
              state={backState}
              data-umami-event={
                mode === 'origin' ? 'origin_city_open_flights' : 'destination_city_open_flights'
              }
              aria-label={t('home.cityCardAria', { city: displayName, price: priceLabel })}
            >
              <span className="city-grouped-row-place">
                <CountryFlag country={group.country} />
                <span className="city-grouped-row-name">{displayName}</span>
                <span className="city-grouped-row-code">{group.cityCode}</span>
              </span>
              <span className="city-grouped-row-meta">
                {t('home.cityOffers', { count: group.offerCount })}
              </span>
              <span className="city-grouped-row-price">
                {t('weekendFlightsFrom.destinationPrice', { price: Math.round(minPrice) })}
              </span>
              <span className="city-grouped-row-chevron" aria-hidden="true">
                →
              </span>
            </LocalizedLink>
          </li>
        );
      })}
    </ul>
  );
}
