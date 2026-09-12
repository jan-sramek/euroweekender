import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import './GroupedCityList.css';

interface GroupedCityListProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
  /** Group by destination (outbound hubs) or origin (inbound hubs). */
  mode: 'destination' | 'origin';
}

interface ListRow {
  key: string;
  cityCode: string;
  cityName: string;
  country: string;
  counterpartCode: string;
  offerCount: number;
  cheapestFlight: Flight;
  indexLocaleFrom: City | undefined;
}

/** Row list of cities (no photo cards): name, offers, price. */
export function GroupedCityList({
  flights,
  citiesByCode,
  passengerCount,
  mode
}: GroupedCityListProps) {
  const { t } = useTranslation();
  const locale = useLocale();

  const rows = useMemo((): ListRow[] => {
    if (mode === 'origin') {
      return groupFlightsByOrigin(flights).map(group => ({
        key: group.cityCode,
        cityCode: group.cityCode,
        cityName: group.cityName,
        country: group.country,
        counterpartCode: group.toCode,
        offerCount: group.offerCount,
        cheapestFlight: group.cheapestFlight,
        indexLocaleFrom: citiesByCode.get(group.cityCode)
      }));
    }

    return groupFlightsByDestination(flights).map(group => ({
      key: group.cityCode,
      cityCode: group.cityCode,
      cityName: group.cityName,
      country: group.country,
      counterpartCode: group.fromCode,
      offerCount: group.offerCount,
      cheapestFlight: group.cheapestFlight,
      indexLocaleFrom: citiesByCode.get(group.fromCode.trim().toUpperCase())
    }));
  }, [flights, mode, citiesByCode]);

  return (
    <ul className="grouped-city-list">
      {rows.map(row => {
        const displayName = getCityNameByCode(
          citiesByCode,
          row.cityCode,
          locale,
          row.cityName
        );
        const fromCode =
          mode === 'origin' ? row.cityCode : row.counterpartCode.trim().toUpperCase();
        const toCode = mode === 'origin' ? row.counterpartCode.trim().toUpperCase() : row.cityCode;
        const from = citiesByCode.get(fromCode);
        const to = citiesByCode.get(toCode);
        const minPrice = getTripPrice(row.cheapestFlight, passengerCount);
        const priceLabel = formatEur(minPrice);
        const href = withWeekendCalendarHash(
          withQuery(
            from && to
              ? weekendComparePath(from, to)
              : `/cheapest-weekend?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`,
            weekendFlightsFocusParams(row.cheapestFlight.localDeparture)
          )
        );

        return (
          <li key={row.key}>
            <LocalizedLink
              className="grouped-city-row"
              locale={
                row.indexLocaleFrom
                  ? preferredIndexableLocale(
                      locale,
                      row.indexLocaleFrom.code,
                      row.indexLocaleFrom.country
                    )
                  : undefined
              }
              to={href}
              data-umami-event={
                mode === 'origin' ? 'origin_city_compare_weekends' : 'destination_city_compare_weekends'
              }
              aria-label={t('home.cityCardAria', { city: displayName, price: priceLabel })}
            >
              <span className="grouped-city-row-place">
                <CountryFlag country={row.country} />
                <span className="grouped-city-row-name">{displayName}</span>
                <span className="grouped-city-row-code">{row.cityCode}</span>
              </span>
              <span className="grouped-city-row-meta">
                {t('home.cityOffers', { count: row.offerCount })}
              </span>
              <span className="grouped-city-row-price">
                {t('weekendFlightsFrom.destinationPrice', { price: Math.round(minPrice) })}
              </span>
            </LocalizedLink>
          </li>
        );
      })}
    </ul>
  );
}
