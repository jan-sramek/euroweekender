import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { WeekendPicker } from '../components/WeekendPicker';
import { FlightCard } from '../components/FlightCard';
import { FlightListSkeleton } from '../components/FlightListSkeleton';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { HomeEmptyDeals } from '../components/HomeEmptyDeals';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SeoPopularRoutes } from '../components/SeoPopularRoutes';
import { HomeSeoExtras } from '../components/HomeSeoExtras';
import { SiteFooter } from '../components/SiteFooter';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useJsonLd } from '../hooks/useJsonLd';
import { useLocale } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useWeekendPatterns } from '../hooks/useWeekendPatterns';
import {
  DEFAULT_WEEKEND_MONTHS,
  findMatchingWeekendIds,
  formatTripTypesLabel,
  formatWeekendsLabel,
  getWeekendIdsForMonths,
  getWeekendOptions,
  getWeekendPatterns,
  WEEKEND_OPTIONS_COUNT
} from '../services/weekend';
import { NO_EVENING_FILTERS } from '../services/weekendFilter';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { faqPageJsonLd } from '../utils/seoSchema';
import type { City } from '../types/city';
import type { WeekendPatternId } from '../types/weekend';
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

export function HomePage() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const weekendPatterns = useWeekendPatterns();

  usePageMeta(t('meta.home.title'), t('meta.home.description'), '/');

  const homeFaqItems = useMemo(() => {
    const items = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
    return Array.isArray(items) ? items.slice(0, 3) : [];
  }, [t, i18n.language]);

  useJsonLd(homeFaqItems.length > 0 ? faqPageJsonLd(homeFaqItems) : null);

  const [selectedPatternIds, setSelectedPatternIds] = useState<WeekendPatternId[]>([]);
  const [eveningFilters, setEveningFilters] = useState(NO_EVENING_FILTERS);
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedWeekendIds, setSelectedWeekendIds] = useState<string[]>([]);
  const [selectedRangeMonths, setSelectedRangeMonths] = useState<number | null>(DEFAULT_WEEKEND_MONTHS);

  const selectedPatterns = useMemo(
    () => getWeekendPatterns(selectedPatternIds),
    [selectedPatternIds]
  );
  const translatedSelectedPatterns = useMemo(
    () => weekendPatterns.filter(pattern => selectedPatternIds.includes(pattern.id)),
    [weekendPatterns, selectedPatternIds]
  );
  const weekends = useMemo(
    () => getWeekendOptions(selectedPatternIds, WEEKEND_OPTIONS_COUNT, locale),
    [selectedPatternIds, locale]
  );

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
    selectedPatterns,
    eveningFilters,
    passengerCount,
    locating
  });

  const resultsResetKey = `${selectedCodes.slice().sort().join(',')}|${selectedWeekendIds.slice().sort().join('|')}`;
  const {
    query: resultsQuery,
    setQuery: setResultsQuery,
    filteredFlights,
    hasTextFilter
  } = useFlightTextFilter(visibleFlights, resultsResetKey, citiesByCode);

  useEffect(() => {
    localizeCityCodes(visibleFlights.flatMap(flight => [flight.cityCodeFrom, flight.cityCodeTo]));
  }, [localizeCityCodes, visibleFlights]);

  useEffect(() => {
    setSelectedWeekendIds(prev => {
      if (selectedRangeMonths != null) {
        return getWeekendIdsForMonths(weekends, selectedRangeMonths);
      }
      return findMatchingWeekendIds(weekends, prev);
    });
  }, [weekends, selectedRangeMonths]);

  const locationLabel = useMemo(
    () => buildLocationLabel(allCities, selectedCodes, locale, t),
    [allCities, selectedCodes, locale, t]
  );

  const weekendsLabel = useMemo(() => {
    if (selectedWeekends.length === 0) return '';
    if (selectedWeekends.length > 3) {
      return t('home.weekendsCount', { count: selectedWeekends.length });
    }
    return formatWeekendsLabel(selectedWeekends, locale);
  }, [selectedWeekends, locale, t]);

  const totalCount = flights.length;
  const shownCount = filteredFlights.length;
  const showFilteredCount = hasLegFilter || hasTextFilter;

  const handleSelectedWeekendIdsChange = (ids: string[]) => {
    setSelectedRangeMonths(null);
    setSelectedWeekendIds(ids);
  };

  const handleClearWeekends = () => {
    setSelectedRangeMonths(null);
    setSelectedWeekendIds([]);
  };

  const handleSelectWeekendMonths = (months: number) => {
    setSelectedRangeMonths(months);
    setSelectedWeekendIds(getWeekendIdsForMonths(weekends, months));
  };

  const handleAddCity = (city: City) => {
    setSelectedCodes(prev => (prev.includes(city.code) ? prev : [...prev, city.code]));
  };

  const flightsCounterLabel = useMemo(() => {
    if (selectedWeekends.length === 0) return null;
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
            <p className="intro-subtitle">{t('home.subtitle')}</p>
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
                    selectedPatternIds={selectedPatternIds}
                    onSelectedPatternIdsChange={setSelectedPatternIds}
                    eveningFilters={eveningFilters}
                    onEveningFiltersChange={setEveningFilters}
                    passengerCount={passengerCount}
                    onPassengerCountChange={setPassengerCount}
                    weekends={weekends}
                    selectedWeekendIds={selectedWeekendIds}
                    selectedRangeMonths={selectedRangeMonths}
                    onSelectedWeekendIdsChange={handleSelectedWeekendIdsChange}
                    onClearWeekends={handleClearWeekends}
                    onSelectWeekendMonths={handleSelectWeekendMonths}
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
          {selectedWeekends.length > 0 && (
            <div className="offers-header">
              <p className="offers-subtitle">
                {t('home.fromSelectedAirports', {
                  airports: locationLabel || t('home.selectedAirports')
                })}{' '}
                · {passengerCount}{' '}
                {passengerCount === 1 ? t('home.person') : t('home.persons')} ·{' '}
                {formatTripTypesLabel(translatedSelectedPatterns, t('home.allTripTypes'))}
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
            <FlightListSkeleton label={t('home.loading')} />
          ) : flights.length === 0 ? (
            <div className="state-box state-box-empty">
              <p>{t('home.noFlights')}</p>
              <HomeEmptyDeals
                allCities={allCities}
                language={i18n.language}
                originCodes={selectedCodes}
              />
              <p className="state-box-hint">{t('home.emptyExplore')}</p>
              <SeoHubLinks allCities={allCities} language={i18n.language} limit={8} />
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
                {hasLegFilter && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearLegFilters}>
                    {t('home.clearLegFiltersBtn')}
                  </button>
                )}
              </div>
              <div className="flight-list results-list">
                {filteredFlights.map(flight => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    citiesByCode={citiesByCode}
                    passengerCount={passengerCount}
                    departureSelected={departureLegFilter === getDepartureLegKey(flight)}
                    returnSelected={returnLegFilter === getReturnLegKey(flight)}
                    onDepartureSelect={selected => handleDepartureLegSelect(flight, selected)}
                    onReturnSelect={selected => handleReturnLegSelect(flight, selected)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-seo" aria-labelledby="home-seo-title">
        <div className="container container-wide">
          <h2 id="home-seo-title" className="home-seo-title">
            {t('home.seoTitle')}
          </h2>
          <p className="home-seo-text">{t('home.seoBlock')}</p>
          <SeoHubLinks allCities={allCities} language={i18n.language} />
          <SeoPopularRoutes language={i18n.language} />
          <HomeSeoExtras />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
