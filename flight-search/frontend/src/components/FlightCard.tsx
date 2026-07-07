import { useTranslation } from 'react-i18next';
import type { Flight } from '../types/flight';
import { useLocale } from '../hooks/useLocale';
import {
  durationMinutesFromLocalIso,
  formatApiLocalTime,
  formatApiLocalTripDate,
  formatLocalDateTimeIso
} from '../utils/flightTime';
import { getReturnArriveDate, getReturnDepartDate } from '../utils/flightLeg';
import { formatEur, getPerPersonPrice, getTripPrice } from '../utils/flightPrice';
import { localizeKiwiDeepLink } from '../utils/kiwiDeepLink';
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
  arriveTimeLabel: string;
  arriveCity: string;
  arriveCode: string;
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
    arriveTimeLabel: formatApiLocalTime(flight.localArrival),
    arriveCity: flight.cityTo,
    arriveCode: flight.flyTo,
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
    arriveTimeLabel: hasStoredReturnTimes ? formatApiLocalTime(returnArriveIso) : '—',
    arriveCity: flight.cityFrom,
    arriveCode: flight.flyFrom,
    durationMinutes,
    stops: flight.technicalStops,
    highlightDepart: true
  };
}

function CityLine({
  time,
  city,
  code,
  highlight
}: {
  time: string;
  city: string;
  code: string;
  highlight?: boolean;
}) {
  return (
    <>
      <strong>{time}</strong>{' '}
      <span className={highlight ? 'destination-city' : undefined}>{city}</span>{' '}
      <span className={`badge${highlight ? ' badge-destination' : ''}`}>{code}</span>
    </>
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
    <div className="result-leg-row">
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
      <div className="result-leg-segment">
        <CityLine
          time={leg.departTimeLabel}
          city={leg.departCity}
          code={leg.departCode}
          highlight={leg.highlightDepart}
        />
      </div>
      <div className="result-leg-segment result-leg-arrival">
        <span className="flight-arrow" aria-hidden="true" />
        <CityLine
          time={leg.arriveTimeLabel}
          city={leg.arriveCity}
          code={leg.arriveCode}
          highlight={leg.highlightArrive}
        />
      </div>
      <div className="result-leg-meta">
        {formatDuration(leg.durationMinutes)}
        <span className="result-leg-meta-sep"> / </span>
        {formatStops(leg.stops)}
      </div>
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
  const bookingUrl = localizeKiwiDeepLink(flight.deepLink, locale);
  const outbound = getOutboundLeg(flight);
  const returnLeg = getReturnLeg(flight);
  const tripDays = flight.nightsInDest + 1;
  const totalPrice = getTripPrice(flight, passengerCount);
  const perPersonPrice = getPerPersonPrice(flight);

  const formatStops = (stops: number) => {
    if (stops === 0) return t('flights.changes_zero');
    if (stops === 1) return t('flights.changes_one');
    return t('flights.changes_other', { count: stops });
  };

  return (
    <article className="block-result">
      <div className="result-destination-banner">
        <span className="result-destination-label">{t('flights.destination')}</span>
        <span className="result-destination-name">
          {flight.cityTo}, {flight.countryTo}
        </span>
        <span className="badge badge-destination">{flight.cityCodeTo}</span>
      </div>

      <div className="result-grid">
        <div className="result-price">
          <p className="price">
            <strong>{formatEur(totalPrice)}</strong>
            <br />
            {passengerCount > 1 ? (
              <>
                {t('flights.perPerson', { price: formatEur(perPersonPrice) })}
                <br />
              </>
            ) : null}
            {t('flights.forDaysTrip', { days: tripDays })}
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
          <hr />
          <FlightLegRow
            leg={returnLeg}
            inputId={`ret-${flight.id}`}
            checked={returnSelected}
            onCheckedChange={onReturnSelect}
            formatStops={formatStops}
          />
        </div>

        <div className="result-action">
          {bookingUrl ? (
            <a
              className="btn btn-primary btn-sm"
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-umami-event="booking_click"
            >
              {t('flights.detail')}
            </a>
          ) : (
            <button className="btn btn-primary btn-sm" type="button" disabled>
              {t('flights.detail')}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
