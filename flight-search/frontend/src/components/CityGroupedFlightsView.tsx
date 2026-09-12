import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { useLocale } from '../hooks/useLocale';
import { getCityNameByCode } from '../utils/cityDisplayName';
import { groupFlightsByDestination, groupFlightsByOrigin } from '../utils/destinationGroups';
import { getTripPrice } from '../utils/flightPrice';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { FlightCard } from './FlightCard';
import { CountryFlag } from './CountryFlag';
import './CityGroupedFlightsView.css';

interface CityGroupedFlightsViewProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
  /** Inbound hubs group by origin; outbound hubs group by destination. */
  mode: 'origin' | 'destination';
  departureLegFilter: string | null;
  returnLegFilter: string | null;
  onDepartureSelect: (flight: Flight, selected: boolean) => void;
  onReturnSelect: (flight: Flight, selected: boolean) => void;
}

/** Results grouped by city: one expandable row per city, flights nested underneath. */
export function CityGroupedFlightsView({
  flights,
  citiesByCode,
  passengerCount,
  mode,
  departureLegFilter,
  returnLegFilter,
  onDepartureSelect,
  onReturnSelect
}: CityGroupedFlightsViewProps) {
  const { t } = useTranslation();
  const locale = useLocale();

  const groups = useMemo(
    () => (mode === 'origin' ? groupFlightsByOrigin(flights) : groupFlightsByDestination(flights)),
    [flights, mode]
  );

  const groupKey = groups.map(group => group.cityCode).join('|');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  useEffect(() => {
    setExpandedCode(groups[0]?.cityCode ?? null);
  }, [groupKey]);

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
        const expanded = expandedCode === group.cityCode;
        const minPrice = getTripPrice(group.cheapestFlight, passengerCount);
        const panelId = `city-group-${group.cityCode}`;

        return (
          <li key={group.cityCode} className={`city-grouped-item${expanded ? ' is-expanded' : ''}`}>
            <button
              type="button"
              className="city-grouped-row"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setExpandedCode(expanded ? null : group.cityCode)}
              data-umami-event="city_group_toggle"
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
                {expanded ? '▾' : '▸'}
              </span>
            </button>

            {expanded ? (
              <div id={panelId} className="city-grouped-flights-panel">
                <div className="flight-list results-list">
                  {group.flights.map(flight => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      citiesByCode={citiesByCode}
                      passengerCount={passengerCount}
                      departureSelected={departureLegFilter === getDepartureLegKey(flight)}
                      returnSelected={returnLegFilter === getReturnLegKey(flight)}
                      onDepartureSelect={selected => onDepartureSelect(flight, selected)}
                      onReturnSelect={selected => onReturnSelect(flight, selected)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
