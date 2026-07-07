import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { WeekendPicker } from '../components/WeekendPicker';
import { FlightCard } from '../components/FlightCard';
import { SiteFooter } from '../components/SiteFooter';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { usePageMeta } from '../hooks/usePageMeta';
import { useWeekendPatterns } from '../hooks/useWeekendPatterns';
import {
  findMatchingWeekendIds,
  formatWeekendsLabel,
  getWeekendOptions,
  getWeekendPattern
} from '../services/weekend';
import { NO_EVENING_FILTERS } from '../services/weekendFilter';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import type { City } from '../types/city';
import type { WeekendPatternId } from '../types/weekend';
import './HomePage.css';

function buildLocationLabel(
  allCities: City[],
  selectedCodes: string[],
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const active = selectedCodes
    .map(code => allCities.find(c => c.code === code))
    .filter((c): c is City => c !== undefined);

  if (active.length === 0) return '';
  if (active.length === 1) return `${active[0].name} (${active[0].code})`;
  return t('home.moreAirports', {
    name: active[0].name,
    count: active.length - 1
  });
}

export function HomePage() {
  const { t } = useTranslation();
  const weekendPatterns = useWeekendPatterns();

  usePageMeta(t('meta.home.title'), t('meta.home.description'));

  const [selectedPatternId, setSelectedPatternId] = useState<WeekendPatternId | null>(null);
  const [eveningFilters, setEveningFilters] = useState(NO_EVENING_FILTERS);
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedWeekendIds, setSelectedWeekendIds] = useState<string[]>([]);

  const selectedPattern = useMemo(
    () => (selectedPatternId ? getWeekendPattern(selectedPatternId) : null),
    [selectedPatternId]
  );
  const translatedSelectedPattern = useMemo(
    () => weekendPatterns.find(pattern => pattern.id === selectedPatternId) ?? null,
    [weekendPatterns, selectedPatternId]
  );
  const weekends = useMemo(() => getWeekendOptions(selectedPatternId, 12), [selectedPatternId]);

  const {
    allCities,
    nearbyCities,
    selectedCodes,
    setSelectedCodes,
    locating,
    errorMessage
  } = useDeparturePrefill();

  const {
    selectedWeekends,
    flights,
    visibleFlights,
    loadingFlights,
    flightError,
    hasLegFilter,
    loadFlights,
    handleDepartureLegSelect,
    handleReturnLegSelect,
    clearLegFilters,
    departureLegFilter,
    returnLegFilter
  } = useFlightSearch({
    selectedCodes,
    weekends,
    selectedWeekendIds,
    selectedPattern,
    eveningFilters,
    passengerCount,
    locating
  });

  useEffect(() => {
    setSelectedWeekendIds(prev => findMatchingWeekendIds(weekends, prev));
  }, [weekends]);

  const locationLabel = useMemo(
    () => buildLocationLabel(allCities, selectedCodes, t),
    [allCities, selectedCodes, t]
  );

  const weekendsLabel = useMemo(() => {
    if (selectedWeekends.length === 0) return '';
    if (selectedWeekends.length > 3) {
      return t('home.weekendsCount', { count: selectedWeekends.length });
    }
    return formatWeekendsLabel(selectedWeekends);
  }, [selectedWeekends, t]);

  const totalCount = flights.length;

  const handleWeekendToggle = (weekendId: string) => {
    setSelectedWeekendIds(prev => {
      if (prev.includes(weekendId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== weekendId);
      }

      const next = [...prev, weekendId];
      next.sort((a, b) => {
        const weekendA = weekends.find(weekend => weekend.id === a);
        const weekendB = weekends.find(weekend => weekend.id === b);
        return (weekendA?.departDate.getTime() ?? 0) - (weekendB?.departDate.getTime() ?? 0);
      });
      return next;
    });
  };

  const handleAddCity = (city: City) => {
    setSelectedCodes(prev => (prev.includes(city.code) ? prev : [...prev, city.code]));
  };

  const flightsCounterLabel = useMemo(() => {
    if (selectedWeekends.length === 0) return null;
    if (loadingFlights && flights.length === 0) {
      return t('home.flightsCounterSearching');
    }
    if (hasLegFilter) {
      return t('home.flightsCounterFiltered', {
        shown: visibleFlights.length,
        total: totalCount
      });
    }
    return t('home.flightsCounter', { count: totalCount });
  }, [
    selectedWeekends.length,
    loadingFlights,
    flights.length,
    hasLegFilter,
    visibleFlights.length,
    totalCount,
    t
  ]);

  return (
    <>
      <AppHeader />

      <section className="home-intro">
        <div className="intro-overlay">
          <div className="container container-wide intro-copy">
            <p className="intro-eyebrow">{t('home.tagline')}</p>
            <h1>{t('home.title')}</h1>
            <p className="intro-lead">{t('home.lead')}</p>
          </div>
          <div className="search-home">
            <div className="container container-wide">
              <div className="searchbar">
                <div className="search-field search-from">
                  <DeparturePicker
                    allCities={allCities}
                    nearbyCities={nearbyCities}
                    selectedCodes={selectedCodes}
                    locating={locating}
                    locationLabel={locationLabel}
                    onSelectedCodesChange={setSelectedCodes}
                    onAddCity={handleAddCity}
                  />
                </div>

                <div className="search-field search-dates">
                  <WeekendPicker
                    patterns={weekendPatterns}
                    selectedPatternId={selectedPatternId}
                    onSelectedPatternIdChange={setSelectedPatternId}
                    eveningFilters={eveningFilters}
                    onEveningFiltersChange={setEveningFilters}
                    passengerCount={passengerCount}
                    onPassengerCountChange={setPassengerCount}
                    weekends={weekends}
                    selectedWeekendIds={selectedWeekendIds}
                    onWeekendToggle={handleWeekendToggle}
                  />
                </div>
              </div>

              {flightsCounterLabel ? (
                <div
                  className={`flights-counter${loadingFlights ? ' flights-counter-loading' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {flightsCounterLabel}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="offers-home">
        <div className="container">
          {selectedWeekends.length > 0 && (
            <div className="offers-header">
              <p className="offers-subtitle">
                {t('home.fromSelectedAirports', {
                  airports: locationLabel || t('home.selectedAirports')
                })}{' '}
                · {passengerCount}{' '}
                {passengerCount === 1 ? t('home.person') : t('home.persons')} ·{' '}
                {translatedSelectedPattern ? translatedSelectedPattern.label : t('home.allTripTypes')}
                {eveningFilters.outboundEvening ? ` · ${t('home.thereEvening')}` : ''}
                {eveningFilters.returnEvening ? ` · ${t('home.backEvening')}` : ''} · {weekendsLabel}
              </p>
            </div>
          )}

          {errorMessage ? (
            <div className="alert alert-warning" role="status">
              {errorMessage}
            </div>
          ) : null}

          {flightError ? (
            <div className="alert alert-error" role="alert">
              {flightError}{' '}
              <button type="button" className="link-button" onClick={() => void loadFlights()}>
                {t('home.tryAgain')}
              </button>
            </div>
          ) : loadingFlights && flights.length === 0 ? (
            <div className="state-box">{t('home.loading')}</div>
          ) : flights.length === 0 ? (
            <div className="state-box">{t('home.noFlights')}</div>
          ) : visibleFlights.length === 0 ? (
            <div className="state-box">
              {t('home.noLegMatch')}{' '}
              <button type="button" className="link-button" onClick={clearLegFilters}>
                {t('home.clearLegFilters')}
              </button>
            </div>
          ) : (
            <>
              <div className="results-toolbar">
                <p className="results-count">
                  {hasLegFilter
                    ? t('home.dealsShown', {
                        shown: visibleFlights.length,
                        total: totalCount
                      })
                    : t('home.dealsFound', { count: totalCount })}
                </p>
                {hasLegFilter && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearLegFilters}>
                    {t('home.clearLegFiltersBtn')}
                  </button>
                )}
              </div>
              <div className="flight-list results-list">
                {visibleFlights.map(flight => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    passengerCount={passengerCount}
                    departureSelected={departureLegFilter === getDepartureLegKey(flight)}
                    returnSelected={returnLegFilter === getReturnLegKey(flight)}
                    onDepartureSelect={selected => handleDepartureLegSelect(flight, selected)}
                    onReturnSelect={selected => handleReturnLegSelect(flight, selected)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
