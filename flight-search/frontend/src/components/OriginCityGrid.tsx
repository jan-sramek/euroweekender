import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { preferredIndexableLocale } from '../config/cityIndexLocales';
import { useCityPhoto } from '../hooks/useCityPhoto';
import { useLocale } from '../hooks/useLocale';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { weekendComparePath } from '../data/seoPopularRoutes';
import { withQuery, withWeekendCalendarHash } from '../utils/citySlug';
import { groupFlightsByOrigin } from '../utils/destinationGroups';
import { formatEur, getTripPrice } from '../utils/flightPrice';
import { getFallbackCityPhoto, CITY_PHOTO_SIZES, cityPhotoSrcSet } from '../utils/cityPhotos';
import { weekendFlightsFocusParams } from '../utils/flightTime';
import { LocalizedLink } from './LocalizedLink';
import { CountryFlag } from './CountryFlag';
import './DestinationCityGrid.css';

interface OriginCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

export function OriginCityGrid({ flights, citiesByCode, passengerCount }: OriginCityGridProps) {
  const groups = useMemo(() => groupFlightsByOrigin(flights), [flights]);

  return (
    <ul className="destination-city-grid">
      {groups.map((group, index) => (
        <li key={group.cityCode}>
          <OriginCityCard
            cityCode={group.cityCode}
            cityName={group.cityName}
            country={group.country}
            toCode={group.toCode}
            toCity={group.toCity}
            cheapestDeparture={group.cheapestFlight.localDeparture}
            minPrice={getTripPrice(group.cheapestFlight, passengerCount)}
            offerCount={group.offerCount}
            citiesByCode={citiesByCode}
            eager={index < 6}
            priority={index < 3}
          />
        </li>
      ))}
    </ul>
  );
}

interface OriginCityCardProps {
  cityCode: string;
  cityName: string;
  country: string;
  toCode: string;
  toCity: string;
  cheapestDeparture: string;
  minPrice: number;
  offerCount: number;
  citiesByCode: Map<string, City>;
  eager: boolean;
  priority: boolean;
}

function OriginCityCard({
  cityCode,
  cityName,
  country,
  toCode,
  toCity,
  cheapestDeparture,
  minPrice,
  offerCount,
  citiesByCode,
  eager,
  priority
}: OriginCityCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const displayName = getCityNameByCode(citiesByCode, cityCode, locale, cityName);
  const toDisplay = getCityNameByCode(citiesByCode, toCode, locale, toCity);
  const { url: photoUrl, ready } = useCityPhoto(cityCode, cityName, country);
  const [failed, setFailed] = useState(false);
  const imageSrc = failed ? getFallbackCityPhoto() : photoUrl;
  const srcSet = !failed ? cityPhotoSrcSet(imageSrc) : undefined;

  const from = citiesByCode.get(cityCode);
  const to = citiesByCode.get(toCode.trim().toUpperCase());
  const href = withWeekendCalendarHash(
    withQuery(
      from && to
        ? weekendComparePath(from, to)
        : `/cheapest-weekend?from=${encodeURIComponent(cityCode)}&to=${encodeURIComponent(toCode)}`,
      weekendFlightsFocusParams(cheapestDeparture)
    )
  );

  const priceLabel = formatEur(minPrice);

  return (
    <LocalizedLink
      className="destination-city-card"
      locale={
        from ? preferredIndexableLocale(locale, from.code, from.country) : undefined
      }
      to={href}
      data-umami-event="origin_city_compare_weekends"
      aria-label={t('home.cityCardAria', { city: displayName, price: priceLabel })}
    >
      <div className="destination-city-card-photo">
        {imageSrc ? (
          <img
            src={imageSrc}
            srcSet={srcSet}
            sizes={srcSet ? CITY_PHOTO_SIZES : undefined}
            alt=""
            width={480}
            height={360}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => {
              if (ready) setFailed(true);
            }}
          />
        ) : null}
      </div>
      <div className="destination-city-card-body">
        <p className="destination-city-card-place">
          <CountryFlag country={country} />
          <span className="destination-city-card-name">{displayName}</span>
          <span className="destination-city-card-code">{cityCode}</span>
        </p>
        <p className="destination-city-card-price">
          {t('weekendFlightsFrom.destinationPrice', { price: Math.round(minPrice) })}
        </p>
        <p className="destination-city-card-meta">
          {t('home.cityOffers', { count: offerCount })}
          {toDisplay ? ` · ${toDisplay}` : ''}
        </p>
        <span className="destination-city-card-cta">{t('nav.cheapestWeekend')}</span>
      </div>
    </LocalizedLink>
  );
}
