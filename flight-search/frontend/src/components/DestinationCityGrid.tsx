import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { useCityPhoto } from '../hooks/useCityPhoto';
import { useLocale } from '../hooks/useLocale';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { weekendFlightsOdPath, withQuery } from '../utils/citySlug';
import { groupFlightsByDestination } from '../utils/destinationGroups';
import { formatEur, getTripPrice } from '../utils/flightPrice';
import { getFallbackCityPhoto, CITY_PHOTO_SIZES, cityPhotoSrcSet } from '../utils/cityPhotos';
import { monthParamFromApiLocal } from '../utils/flightTime';
import { LocalizedLink } from './LocalizedLink';
import { CountryFlag } from './CountryFlag';
import './DestinationCityGrid.css';

interface DestinationCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

export function DestinationCityGrid({
  flights,
  citiesByCode,
  passengerCount
}: DestinationCityGridProps) {
  const groups = useMemo(() => groupFlightsByDestination(flights), [flights]);

  return (
    <ul className="destination-city-grid">
      {groups.map((group, index) => (
        <li key={group.cityCode}>
          <DestinationCityCard
            cityCode={group.cityCode}
            cityName={group.cityName}
            country={group.country}
            fromCode={group.fromCode}
            fromCity={group.fromCity}
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

interface DestinationCityCardProps {
  cityCode: string;
  cityName: string;
  country: string;
  fromCode: string;
  fromCity: string;
  cheapestDeparture: string;
  minPrice: number;
  offerCount: number;
  citiesByCode: Map<string, City>;
  eager: boolean;
  priority: boolean;
}

function DestinationCityCard({
  cityCode,
  cityName,
  country,
  fromCode,
  fromCity,
  cheapestDeparture,
  minPrice,
  offerCount,
  citiesByCode,
  eager,
  priority
}: DestinationCityCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const displayName = getCityNameByCode(citiesByCode, cityCode, locale, cityName);
  const fromDisplay = getCityNameByCode(citiesByCode, fromCode, locale, fromCity);
  const { url: photoUrl, ready } = useCityPhoto(cityCode, cityName, country);
  const [failed, setFailed] = useState(false);
  const imageSrc = failed ? getFallbackCityPhoto() : photoUrl;
  const srcSet = !failed ? cityPhotoSrcSet(imageSrc) : undefined;

  const from = citiesByCode.get(fromCode.trim().toUpperCase());
  const to = citiesByCode.get(cityCode);
  const href = withQuery(
    from && to
      ? weekendFlightsOdPath(from, to)
      : `/cheapest-weekend?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(cityCode)}`,
    { month: monthParamFromApiLocal(cheapestDeparture) }
  );

  const priceLabel = formatEur(minPrice);

  return (
    <LocalizedLink
      className="destination-city-card"
      to={href}
      data-umami-event="destination_city_compare_weekends"
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
          {fromDisplay ? ` · ${fromDisplay}` : ''}
        </p>
        <span className="destination-city-card-cta">{t('nav.cheapestWeekend')}</span>
      </div>
    </LocalizedLink>
  );
}
