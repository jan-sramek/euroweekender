import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { useLocale, useLocalizedPath } from '../hooks/useLocale';
import {
  formatApiLocalTime,
  formatApiLocalTripDate,
  formatLocalDateTimeIso,
  weekendFlightsFocusParams
} from '../utils/flightTime';
import { getReturnArriveDate, getReturnDepartDate } from '../utils/flightLeg';
import { formatEur, getPerPersonPrice, getTripPrice } from '../utils/flightPrice';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { weekendFlightsOdPath, withQuery } from '../utils/citySlug';
import { localizeKiwiDeepLink } from '../utils/kiwiDeepLink';
import { CountryFlag } from './CountryFlag';
import './FlightCard.css';

function CalendarIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3.5a.75.75 0 0 1 .75.75V5h8.5V4.25a.75.75 0 0 1 1.5 0V5H19a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1.25V4.25A.75.75 0 0 1 7 3.5ZM4.5 9.5v9.5a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V9.5h-15Z"
      />
      <path
        fill="currentColor"
        d="M8 12.25h2.5v2.5H8v-2.5Zm5.25 0H16v2.5h-2.75v-2.5ZM8 16.5h2.5V19H8v-2.5Zm5.25 0H16V19h-2.75v-2.5Z"
        opacity="0.85"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V5.81l-8.72 8.72a.75.75 0 1 1-1.06-1.06l8.72-8.72h-3.44a.75.75 0 0 1-.75-.75Z"
      />
      <path
        fill="currentColor"
        d="M5.75 5A1.75 1.75 0 0 0 4 6.75v11.5C4 19.216 4.784 20 5.75 20h11.5A1.75 1.75 0 0 0 19 18.25v-5a.75.75 0 0 0-1.5 0v5a.25.25 0 0 1-.25.25H5.75a.25.25 0 0 1-.25-.25V6.75a.25.25 0 0 1 .25-.25h5a.75.75 0 0 0 0-1.5h-5Z"
      />
    </svg>
  );
}

interface FlightCardProps {
  flight: Flight;
  citiesByCode?: Map<string, City>;
  passengerCount: number;
  departureSelected: boolean;
  returnSelected: boolean;
  onDepartureSelect: (selected: boolean) => void;
  onReturnSelect: (selected: boolean) => void;
}

interface LegDisplay {
  dateIso: string;
  departTimeLabel: string;
  departCity: string;
  departCode: string;
  departCountry: string;
  arriveTimeLabel: string;
  arriveCity: string;
  arriveCode: string;
  arriveCountry: string;
  durationMinutes: number;
  stops: number;
  highlightDepart?: boolean;
  highlightArrive?: boolean;
}

function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getOutboundLeg(flight: Flight, cityFrom: string, cityTo: string): LegDisplay {
  return {
    dateIso: flight.localDeparture,
    departTimeLabel: formatApiLocalTime(flight.localDeparture),
    departCity: cityFrom,
    departCode: flight.flyFrom,
    departCountry: flight.countryFrom ?? '',
    arriveTimeLabel: formatApiLocalTime(flight.localArrival),
    arriveCity: cityTo,
    arriveCode: flight.flyTo,
    arriveCountry: flight.countryTo,
    durationMinutes: Math.round(flight.durationDeparture),
    stops: flight.technicalStops,
    highlightArrive: true
  };
}

function getReturnLeg(flight: Flight, cityFrom: string, cityTo: string): LegDisplay {
  const hasStoredReturnTimes = Boolean(flight.localReturnDeparture && flight.localReturnArrival);
  const returnDepartIso =
    flight.localReturnDeparture ?? formatLocalDateTimeIso(getReturnDepartDate(flight));
  const returnArriveIso =
    flight.localReturnArrival ?? formatLocalDateTimeIso(getReturnArriveDate(flight));

  return {
    dateIso: returnDepartIso,
    departTimeLabel: hasStoredReturnTimes ? formatApiLocalTime(returnDepartIso) : '—',
    departCity: cityTo,
    departCode: flight.flyTo,
    departCountry: flight.countryTo,
    arriveTimeLabel: hasStoredReturnTimes ? formatApiLocalTime(returnArriveIso) : '—',
    arriveCity: cityFrom,
    arriveCode: flight.flyFrom,
    arriveCountry: flight.countryFrom ?? '',
    durationMinutes: Math.round(flight.durationReturn),
    stops: flight.technicalStopsReturn ?? 0,
    highlightDepart: true
  };
}

function Endpoint({
  time,
  city,
  code,
  country,
  highlight
}: {
  time: string;
  city: string;
  code: string;
  country: string;
  highlight?: boolean;
}) {
  return (
    <div className={`result-endpoint${highlight ? ' result-endpoint-highlight' : ''}`}>
      <strong className="result-endpoint-time">{time}</strong>
      <span className="result-endpoint-place">
        <CountryFlag country={country} />
        <span className="result-endpoint-city">{city}</span>
        <span className={`badge${highlight ? ' badge-destination' : ''}`}>{code}</span>
      </span>
    </div>
  );
}

function FlightLegRow({
  leg,
  directionLabel,
  inputId,
  checked,
  onCheckedChange,
  formatStops
}: {
  leg: LegDisplay;
  directionLabel: string;
  inputId: string;
  checked: boolean;
  onCheckedChange: (selected: boolean) => void;
  formatStops: (stops: number) => string;
}) {
  return (
    <div className={`result-leg-row${checked ? ' result-leg-row-selected' : ''}`}>
      <span className="result-leg-direction">{directionLabel}</span>
      <div className="result-leg-date">
        <label className="leg-date-label" htmlFor={inputId}>
          <input
            type="checkbox"
            className="leg-date-checkbox"
            id={inputId}
            checked={checked}
            onChange={event => onCheckedChange(event.target.checked)}
          />
          <span>{formatApiLocalTripDate(leg.dateIso)}</span>
        </label>
      </div>

      <Endpoint
        time={leg.departTimeLabel}
        city={leg.departCity}
        code={leg.departCode}
        country={leg.departCountry}
        highlight={leg.highlightDepart}
      />

      <div className="result-leg-meta">
        {formatDuration(leg.durationMinutes)}
        <span className="result-leg-meta-sep"> / </span>
        {formatStops(leg.stops)}
      </div>

      <Endpoint
        time={leg.arriveTimeLabel}
        city={leg.arriveCity}
        code={leg.arriveCode}
        country={leg.arriveCountry}
        highlight={leg.highlightArrive}
      />
    </div>
  );
}

export function FlightCard({
  flight,
  citiesByCode,
  passengerCount,
  departureSelected,
  returnSelected,
  onDepartureSelect,
  onReturnSelect
}: FlightCardProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const { path } = useLocalizedPath();
  const location = useLocation();
  const cityFrom = getCityNameByCode(citiesByCode, flight.cityCodeFrom, locale, flight.cityFrom);
  const cityTo = getCityNameByCode(citiesByCode, flight.cityCodeTo, locale, flight.cityTo);
  const bookingUrl = localizeKiwiDeepLink(flight.deepLink, locale);
  const outbound = getOutboundLeg(flight, cityFrom, cityTo);
  const returnLeg = getReturnLeg(flight, cityFrom, cityTo);
  const tripDays = flight.nightsInDest + 1;
  const totalPrice = getTripPrice(flight, passengerCount);
  const perPersonPrice = getPerPersonPrice(flight);
  const showBestWeekendPriceLink =
    !location.pathname.includes('/cheapest-weekend') &&
    !location.pathname.includes('/weekend-flights/') &&
    !location.pathname.includes('/single-day-trips');
  const fromCityRecord = citiesByCode?.get(flight.cityCodeFrom.trim().toUpperCase());
  const toCityRecord = citiesByCode?.get(flight.cityCodeTo.trim().toUpperCase());
  const comparePath =
    fromCityRecord && toCityRecord
      ? weekendFlightsOdPath(fromCityRecord, toCityRecord)
      : `/cheapest-weekend?from=${encodeURIComponent(flight.cityCodeFrom)}&to=${encodeURIComponent(flight.cityCodeTo)}`;
  const bestWeekendPriceTo = path(
    withQuery(comparePath, weekendFlightsFocusParams(flight.localDeparture))
  );

  const formatStops = (stops: number) => {
    if (stops === 0) return t('flights.changes_zero');
    if (stops === 1) return t('flights.changes_one');
    return t('flights.changes_other', { count: stops });
  };

  return (
    <article className="block-result">
      <div
        className="result-destination-banner"
        aria-label={`${t('flights.from')} ${cityFrom}, ${t('flights.to')} ${cityTo}`}
      >
        <span className="result-route-end">
          <span className="result-route-label">{t('flights.from')}</span>
          <span className="result-route-place">
            <CountryFlag country={flight.countryFrom} />
            <span className="result-destination-name">{cityFrom}</span>
            <span className="badge">{flight.cityCodeFrom}</span>
          </span>
        </span>
        <span className="result-route-arrow" aria-hidden="true">
          →
        </span>
        <span className="result-route-end result-route-end-to">
          <span className="result-route-label">{t('flights.to')}</span>
          <span className="result-route-place">
            <CountryFlag country={flight.countryTo} />
            <span className="result-destination-name">
              {cityTo}
              <span className="result-destination-country">{flight.countryTo}</span>
            </span>
            <span className="badge badge-destination">{flight.cityCodeTo}</span>
          </span>
        </span>
      </div>

      <div className="result-grid">
        <div className="result-price">
          <p className="price">
            <strong>{formatEur(totalPrice)}</strong>
            {passengerCount > 1 ? (
              <span className="price-sub">{t('flights.perPerson', { price: formatEur(perPersonPrice) })}</span>
            ) : null}
            <span className="price-sub">{t('flights.forDaysTrip', { days: tripDays })}</span>
          </p>
        </div>

        <div className="result-legs">
          <FlightLegRow
            leg={outbound}
            directionLabel={t('flights.outbound')}
            inputId={`out-${flight.id}`}
            checked={departureSelected}
            onCheckedChange={onDepartureSelect}
            formatStops={formatStops}
          />
          <FlightLegRow
            leg={returnLeg}
            directionLabel={t('flights.return')}
            inputId={`ret-${flight.id}`}
            checked={returnSelected}
            onCheckedChange={onReturnSelect}
            formatStops={formatStops}
          />
        </div>

        <div className="result-action">
          {showBestWeekendPriceLink ? (
            <Link
              className="btn btn-secondary btn-sm"
              to={bestWeekendPriceTo}
              data-umami-event="best_weekend_price_click"
            >
              <CalendarIcon />
              {t('nav.cheapestWeekend')}
            </Link>
          ) : null}
          {bookingUrl ? (
            <a
              className="btn btn-primary btn-sm"
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="booking_click"
            >
              <BookIcon />
              {t('flights.book')}
            </a>
          ) : (
            <button className="btn btn-primary btn-sm" type="button" disabled>
              <BookIcon />
              {t('flights.book')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
