import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { DayTripPicker } from '../components/DayTripPicker';
import { DestinationCityGrid } from '../components/DestinationCityGrid';
import { FlightCard } from '../components/FlightCard';
import { FlightListSkeleton } from '../components/FlightListSkeleton';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { HomeEmptyDeals } from '../components/HomeEmptyDeals';
import { HomeSeoExtras } from '../components/HomeSeoExtras';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ResultsViewToggle } from '../components/ResultsViewToggle';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SeoPopularRoutes } from '../components/SeoPopularRoutes';
import { SiteFooter } from '../components/SiteFooter';
import { useDayTripSearch } from '../hooks/useDayTripSearch';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useLocale } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useResultsViewMode } from '../hooks/useResultsViewMode';
import {
  DAY_TRIP_OPTIONS_MONTHS,
  getDayTripIdsForMonths,
  getDefaultDayTripIds,
  getUpcomingDayTripOptions
} from '../services/dayTrip';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import type { City } from '../types/city';
import './HomePage.css';

function buildLocationLabel(
  allCities: City[],
  selectedCodes: string[],
  language: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const active = selectedCodes
    .map(code => allCities.find(c => c.code === code))
    .filter((c): c is City => c !== undefined);

  if (active.length === 0) return '';
  if (active.length === 1) {
    return `${getCityDisplayName(active[0], language)} (${active[0].code})`;
  }
  return t('home.moreAirports', {
    name: getCityDisplayName(active[0], language),
    count: active.length - 1
  });
}

export function SingleDayTripsPage() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();

  usePageMeta(
    t('meta.singleDayTrips.title'),
    t('meta.singleDayTrips.description'),
    '/single-day-trips'
  );

  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [selectedRangeMonths, setSelectedRangeMonths] = useState<number | null>(
    DAY_TRIP_OPTIONS_MONTHS
  );
  const [resultsView, setResultsView] = useResultsViewMode();
  const defaultsApplied = useRef(false);

  const days = useMemo(
    () => getUpcomingDayTripOptions(DAY_TRIP_OPTIONS_MONTHS, i18n.language),
    [i18n.language]
  );

  useEffect(() => {
    if (defaultsApplied.current || days.length === 0) return;
    defaultsApplied.current = true;
    setSelectedDayIds(getDefaultDayTripIds(days, DAY_TRIP_OPTIONS_MONTHS));
  }, [days]);

  const {
    allCities,
    citiesByCode,
    nearbyCities,
    selectedCodes,
    setSelectedCodes,
    localizeCityCodes,
    locating,
    errorMessage
  } = useDeparturePrefill();

  const {
    selectedDays,
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
  } = useDayTripSearch({
    selectedCodes,
    days,
    selectedDayIds,
    passengerCount,
    locating
  });

  const resultsResetKey = `${selectedCodes.slice().sort().join(',')}|${selectedDayIds.slice().sort().join('|')}`;
  const {
    query: resultsQuery,
    setQuery: setResultsQuery,
    filteredFlights,
    hasTextFilter
  } = useFlightTextFilter(visibleFlights, resultsResetKey, citiesByCode);

  useEffect(() => {
    localizeCityCodes(visibleFlights.flatMap(flight => [flight.cityCodeFrom, flight.cityCodeTo]));
  }, [localizeCityCodes, visibleFlights]);

  const locationLabel = useMemo(
    () => buildLocationLabel(allCities, selectedCodes, locale, t),
    [allCities, selectedCodes, locale, t]
  );

  const daysLabel = useMemo(() => {
    if (selectedDays.length === 0) return '';
    if (selectedDays.length > 3) {
      return t('singleDayTrips.daysCount', { count: selectedDays.length });
    }
    return selectedDays.map(day => day.shortLabel).join(', ');
  }, [selectedDays, t]);

  const totalCount = flights.length;
  const shownCount = filteredFlights.length;
  const showFilteredCount = hasLegFilter || hasTextFilter;

  const handleSelectedDayIdsChange = (ids: string[]) => {
    setSelectedRangeMonths(null);
    setSelectedDayIds(ids);
  };

  const handleClearDays = () => {
    setSelectedRangeMonths(null);
    setSelectedDayIds([]);
  };

  const handleSelectMonths = (months: number) => {
    setSelectedRangeMonths(months);
    setSelectedDayIds(getDayTripIdsForMonths(days, months));
  };

  const handleAddCity = (city: City) => {
    setSelectedCodes(prev => (prev.includes(city.code) ? prev : [...prev, city.code]));
  };

  const flightsCounterLabel = useMemo(() => {
    if (selectedDays.length === 0) return null;
    if (loadingFlights) {
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
    selectedDays.length,
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
            <p className="intro-eyebrow">{t('singleDayTrips.tagline')}</p>
            <h1>{t('singleDayTrips.title')}</h1>
            <p className="intro-subtitle">{t('singleDayTrips.subtitle')}</p>
            <p className="intro-lead">{t('singleDayTrips.lead')}</p>
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
                  <DayTripPicker
                    days={days}
                    selectedDayIds={selectedDayIds}
                    selectedRangeMonths={selectedRangeMonths}
                    onSelectedDayIdsChange={handleSelectedDayIdsChange}
                    onClearDays={handleClearDays}
                    onSelectMonths={handleSelectMonths}
                    passengerCount={passengerCount}
                    onPassengerCountChange={setPassengerCount}
                  />
                </div>
              </div>

              {flightsCounterLabel ? (
                <div
                  className={`flights-counter${loadingFlights ? ' flights-counter-loading' : ''}`}
                  role="status"
                  aria-live="polite"
                >
                  {loadingFlights ? <LoadingIndicator size="sm" /> : null}
                  {flightsCounterLabel}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="offers-home">
        <div className="container">
          {selectedDays.length > 0 && (
            <div className="offers-header">
              <p className="offers-subtitle">
                {t('home.fromSelectedAirports', {
                  airports: locationLabel || t('home.selectedAirports')
                })}{' '}
                · {passengerCount}{' '}
                {passengerCount === 1 ? t('home.person') : t('home.persons')} ·{' '}
                {t('singleDayTrips.scheduleSummary')} · {daysLabel}
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
            <FlightListSkeleton label={t('home.loading')} />
          ) : flights.length === 0 ? (
            <div className="state-box state-box-empty">
              <p>{t('singleDayTrips.noFlights')}</p>
              <HomeEmptyDeals
                allCities={allCities}
                language={i18n.language}
                originCodes={selectedCodes}
              />
              <p className="state-box-hint">{t('home.emptyExplore')}</p>
              <SeoHubLinks
                allCities={allCities}
                language={i18n.language}
                variant="dayTrips"
                limit={8}
              />
            </div>
          ) : visibleFlights.length === 0 ? (
            <div className="state-box">
              {t('home.noLegMatch')}{' '}
              <button type="button" className="link-button" onClick={clearLegFilters}>
                {t('home.clearLegFilters')}
              </button>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="results-panel">
              <FlightResultsSearch value={resultsQuery} onChange={setResultsQuery} />
              <div className="state-box">
                {t('home.noTextMatch')}{' '}
                <button type="button" className="link-button" onClick={() => setResultsQuery('')}>
                  {t('home.clearResultsSearch')}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`results-panel${loadingFlights ? ' results-panel-loading' : ''}`}
              aria-busy={loadingFlights}
            >
              <FlightResultsSearch value={resultsQuery} onChange={setResultsQuery} />
              <div className="results-toolbar">
                <p className="results-count">
                  {showFilteredCount
                    ? t('home.dealsShown', {
                        shown: shownCount,
                        total: totalCount
                      })
                    : t('home.dealsFound', { count: totalCount })}
                </p>
                <div className="results-toolbar-actions">
                  {hasLegFilter && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={clearLegFilters}>
                      {t('home.clearLegFiltersBtn')}
                    </button>
                  )}
                  <ResultsViewToggle value={resultsView} onChange={setResultsView} />
                </div>
              </div>
              {resultsView === 'cities' ? (
                <DestinationCityGrid
                  flights={filteredFlights}
                  citiesByCode={citiesByCode}
                  passengerCount={passengerCount}
                />
              ) : (
                <div className="flight-list results-list">
                  {filteredFlights.map(flight => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      citiesByCode={citiesByCode}
                      passengerCount={passengerCount}
                      departureSelected={departureLegFilter === getDepartureLegKey(flight)}
                      returnSelected={returnLegFilter === getReturnLegKey(flight)}
                      onDepartureSelect={selected =>
                        handleDepartureLegSelect(selected ? getDepartureLegKey(flight) : null)
                      }
                      onReturnSelect={selected =>
                        handleReturnLegSelect(selected ? getReturnLegKey(flight) : null)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="home-seo" aria-labelledby="single-day-seo-title">
        <div className="container container-wide">
          <h2 id="single-day-seo-title" className="home-seo-title">
            {t('singleDayTrips.seoTitle')}
          </h2>
          <p className="home-seo-text">{t('singleDayTrips.seoBlock')}</p>
          <SeoHubLinks allCities={allCities} language={i18n.language} variant="dayTrips" />
          <SeoPopularRoutes language={i18n.language} />
          <HomeSeoExtras />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
