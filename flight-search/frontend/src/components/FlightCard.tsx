import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import type { Flight } from '../types/flight';
import { useLocale, useLocalizedPath } from '../hooks/useLocale';
import {
  durationMinutesFromLocalIso,
  formatApiLocalTime,
  formatApiLocalTripDate,
  formatLocalDateTimeIso
} from '../utils/flightTime';
import { getReturnArriveDate, getReturnDepartDate } from '../utils/flightLeg';
import { formatEur, getPerPersonPrice, getTripPrice } from '../utils/flightPrice';
import { localizeKiwiDeepLink } from '../utils/kiwiDeepLink';
import { CountryFlag } from './CountryFlag';
import './FlightCard.css';

interface FlightCardProps {
  flight: Flight;
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

function getOutboundLeg(flight: Flight): LegDisplay {
  return {
    dateIso: flight.localDeparture,
    departTimeLabel: formatApiLocalTime(flight.localDeparture),
    departCity: flight.cityFrom,
    departCode: flight.flyFrom,
    departCountry: flight.countryFrom ?? '',
    arriveTimeLabel: formatApiLocalTime(flight.localArrival),
    arriveCity: flight.cityTo,
    arriveCode: flight.flyTo,
    arriveCountry: flight.countryTo,
    durationMinutes: durationMinutesFromLocalIso(flight.localDeparture, flight.localArrival),
    stops: flight.technicalStops,
    highlightArrive: true
  };
}

function getReturnLeg(flight: Flight): LegDisplay {
  const hasStoredReturnTimes = Boolean(flight.localReturnDeparture && flight.localReturnArrival);
  const returnDepartIso =
    flight.localReturnDeparture ?? formatLocalDateTimeIso(getReturnDepartDate(flight));
  const returnArriveIso =
    flight.localReturnArrival ?? formatLocalDateTimeIso(getReturnArriveDate(flight));

  const durationMinutes =
    flight.localReturnDeparture && flight.localReturnArrival
      ? durationMinutesFromLocalIso(flight.localReturnDeparture, flight.localReturnArrival)
      : Math.round(flight.durationReturn);

  return {
    dateIso: returnDepartIso,
    departTimeLabel: hasStoredReturnTimes ? formatApiLocalTime(returnDepartIso) : '—',
    departCity: flight.cityTo,
    departCode: flight.flyTo,
    departCountry: flight.countryTo,
    arriveTimeLabel: hasStoredReturnTimes ? formatApiLocalTime(returnArriveIso) : '—',
    arriveCity: flight.cityFrom,
    arriveCode: flight.flyFrom,
    arriveCountry: flight.countryFrom ?? '',
    durationMinutes,
    stops: flight.technicalStops,
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
  inputId,
  checked,
  onCheckedChange,
  formatStops
}: {
  leg: LegDisplay;
  inputId: string;
  checked: boolean;
  onCheckedChange: (selected: boolean) => void;
  formatStops: (stops: number) => string;
}) {
  return (
    <div className={`result-leg-row${checked ? ' result-leg-row-selected' : ''}`}>
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
  const bookingUrl = localizeKiwiDeepLink(flight.deepLink, locale);
  const outbound = getOutboundLeg(flight);
  const returnLeg = getReturnLeg(flight);
  const tripDays = flight.nightsInDest + 1;
  const totalPrice = getTripPrice(flight, passengerCount);
  const perPersonPrice = getPerPersonPrice(flight);
  const showBestWeekendPriceLink =
    !location.pathname.includes('/cheapest-weekend') &&
    !location.pathname.includes('/single-day-trips');
  const bestWeekendPriceTo = `${path('/cheapest-weekend')}?from=${encodeURIComponent(flight.cityCodeFrom)}&to=${encodeURIComponent(flight.cityCodeTo)}`;

  const formatStops = (stops: number) => {
    if (stops === 0) return t('flights.changes_zero');
    if (stops === 1) return t('flights.changes_one');
    return t('flights.changes_other', { count: stops });
  };

  return (
    <article className="block-result">
      <div className="result-destination-banner">
        <CountryFlag country={flight.countryTo} />
        <span className="result-destination-name">
          {flight.cityTo}
          <span className="result-destination-country">{flight.countryTo}</span>
        </span>
        <span className="badge badge-destination">{flight.cityCodeTo}</span>
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
            inputId={`out-${flight.id}`}
            checked={departureSelected}
            onCheckedChange={onDepartureSelect}
            formatStops={formatStops}
          />
          <FlightLegRow
            leg={returnLeg}
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
              {t('flights.book')}
            </a>
          ) : (
            <button className="btn btn-primary btn-sm" type="button" disabled>
              {t('flights.book')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
