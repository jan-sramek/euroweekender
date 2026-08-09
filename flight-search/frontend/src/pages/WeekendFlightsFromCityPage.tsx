import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { FlightCard } from '../components/FlightCard';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SeoDestinationLinks } from '../components/SeoDestinationLinks';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SiteFooter } from '../components/SiteFooter';
import { WeekendPicker } from '../components/WeekendPicker';
import { LocalizedLink } from '../components/LocalizedLink';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useJsonLd } from '../hooks/useJsonLd';
import { useLocalizedPath } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useWeekendPatterns } from '../hooks/useWeekendPatterns';
import { getHubScores, getTopDestinations } from '../services/api';
import { findCityByCode } from '../services/locationPrefill';
import {
  findMatchingWeekendIds,
  formatWeekendsLabel,
  getWeekendIdsForMonths,
  getWeekendOptions,
  getWeekendPattern,
  WEEKEND_OPTIONS_COUNT
} from '../services/weekend';
import { NO_EVENING_FILTERS } from '../services/weekendFilter';
import { getCityDisplayName } from '../utils/cityDisplayName';
import {
  buildCitySlug,
  dayTripsFromPath,
  parseCityCodeFromSlug,
  weekendFlightsFromPath
} from '../utils/citySlug';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { breadcrumbListJsonLd, faqPageJsonLd } from '../utils/seoSchema';
import type { City, HubScore, OriginDestination } from '../types/city';
import type { WeekendPatternId } from '../types/weekend';
import { NotFoundPage } from './NotFoundPage';
import '../layouts/ContentPageLayout.css';
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

export function WeekendFlightsFromCityPage() {
  const { t, i18n } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { path } = useLocalizedPath();
  const weekendPatterns = useWeekendPatterns();
  const parsedCode = parseCityCodeFromSlug(citySlug);
  const preferredCodes = useMemo(
    () => (parsedCode ? [parsedCode] : null),
    [parsedCode]
  );

  const {
    allCities,
    nearbyCities,
    popularHubCities,
    selectedCodes,
    setSelectedCodes,
    locating,
    errorMessage
  } = useDeparturePrefill({ preferredCodes });

  const city = useMemo(
    () => (parsedCode ? findCityByCode(allCities, parsedCode) : undefined),
    [allCities, parsedCode]
  );

  const cityLabel = city ? getCityDisplayName(city, i18n.language) : '';
  const metaCity = cityLabel || parsedCode || '';

  usePageMeta(
    t('meta.weekendFlightsFrom.title', { city: metaCity }),
    t('meta.weekendFlightsFrom.description', { city: metaCity }),
    city ? weekendFlightsFromPath(city) : '/404'
  );

  const [hubScore, setHubScore] = useState<HubScore | null>(null);
  const [topDestinations, setTopDestinations] = useState<OriginDestination[]>([]);

  useEffect(() => {
    if (!parsedCode) return;
    let cancelled = false;

    void getHubScores().then(
      scores => {
        if (cancelled) return;
        setHubScore(scores.find(score => score.code.toUpperCase() === parsedCode) ?? null);
      },
      () => undefined
    );

    void getTopDestinations(parsedCode).then(
      destinations => {
        if (!cancelled) setTopDestinations(destinations);
      },
      () => undefined
    );

    return () => {
      cancelled = true;
    };
  }, [parsedCode]);

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
  const weekends = useMemo(
    () => getWeekendOptions(selectedPatternId, WEEKEND_OPTIONS_COUNT),
    [selectedPatternId]
  );

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

  const resultsResetKey = `${selectedCodes.slice().sort().join(',')}|${selectedWeekendIds.slice().sort().join('|')}`;
  const {
    query: resultsQuery,
    setQuery: setResultsQuery,
    filteredFlights,
    hasTextFilter
  } = useFlightTextFilter(visibleFlights, resultsResetKey);

  useEffect(() => {
    setSelectedWeekendIds(prev => findMatchingWeekendIds(weekends, prev));
  }, [weekends]);

  const locationLabel = useMemo(
    () => buildLocationLabel(allCities, selectedCodes, i18n.language, t),
    [allCities, selectedCodes, i18n.language, t]
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

  const handleClearWeekends = () => {
    setSelectedWeekendIds([]);
  };

  const handleSelectWeekendMonths = (months: number) => {
    setSelectedWeekendIds(getWeekendIdsForMonths(weekends, months));
  };

  const handleAddCity = (nextCity: City) => {
    setSelectedCodes(prev => (prev.includes(nextCity.code) ? prev : [...prev, nextCity.code]));
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

  const faqItems = useMemo(() => {
    if (!cityLabel) return [];
    return (t('weekendFlightsFrom.faq', { city: cityLabel, returnObjects: true }) as Array<{
      q: string;
      a: string;
    }>) ?? [];
  }, [cityLabel, t]);

  useJsonLd(faqItems.length > 0 ? faqPageJsonLd(faqItems) : null);

  const breadcrumbJsonLd = useMemo(() => {
    if (!city) return null;
    return breadcrumbListJsonLd([
      { name: t('nav.home'), path: path('/') },
      { name: t('weekendFlightsFrom.tagline', { city: cityLabel }), path: path(weekendFlightsFromPath(city)) }
    ]);
  }, [city, cityLabel, path, t]);

  useJsonLd(breadcrumbJsonLd);

  if (!parsedCode) {
    return <NotFoundPage />;
  }

  if (allCities.length === 0 && locating) {
    return (
      <>
        <AppHeader />
        <div className="container">
          <div className="state-box state-box-loading">
            <LoadingIndicator size="md" label={t('home.loading')} />
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  if (!city) {
    return <NotFoundPage />;
  }

  const canonicalSlug = buildCitySlug(city);
  if (citySlug?.toLowerCase() !== canonicalSlug) {
    return <Navigate to={path(weekendFlightsFromPath(city))} replace />;
  }

  return (
    <>
      <AppHeader />

      <section className="home-intro">
        <div className="intro-overlay">
          <div className="container container-wide intro-copy">
            <p className="intro-eyebrow">{t('weekendFlightsFrom.tagline', { city: cityLabel })}</p>
            <h1>{t('weekendFlightsFrom.title', { city: cityLabel })}</h1>
            <p className="intro-subtitle">{t('weekendFlightsFrom.subtitle', { city: cityLabel })}</p>
            <p className="intro-lead">{t('weekendFlightsFrom.lead', { city: cityLabel })}</p>
            {hubScore && hubScore.minPrice > 0 && hubScore.destinationCount > 0 ? (
              <p className="intro-lead">
                {t('weekendFlightsFrom.priceHint', {
                  city: cityLabel,
                  minPrice: Math.round(hubScore.minPrice),
                  destinationCount: hubScore.destinationCount
                })}
              </p>
            ) : null}
          </div>
          <div className="search-home">
            <div className="container container-wide">
              <div className="searchbar">
                <div className="search-field search-from">
                  <DeparturePicker
                    allCities={allCities}
                    nearbyCities={nearbyCities}
                    popularHubCities={popularHubCities}
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
            <div className="state-box state-box-loading">
              <LoadingIndicator size="md" label={t('home.loading')} />
            </div>
          ) : flights.length === 0 ? (
            <div className="state-box">{t('home.noFlights')}</div>
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
            <div className={`results-panel${loadingFlights ? ' results-panel-loading' : ''}`}>
              {loadingFlights ? (
                <div className="results-loading-overlay" aria-hidden="true">
                  <LoadingIndicator size="md" label={t('home.flightsCounterSearching')} />
                </div>
              ) : null}
              <FlightResultsSearch value={resultsQuery} onChange={setResultsQuery} />
              <div className="results-toolbar">
                <p className="results-count">
                  {hasLegFilter || hasTextFilter
                    ? t('home.dealsShown', {
                        shown: filteredFlights.length,
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

      <section className="home-seo" aria-labelledby="weekend-from-seo-title">
        <div className="container container-wide">
          <h2 id="weekend-from-seo-title" className="home-seo-title">
            {t('weekendFlightsFrom.seoTitle', { city: cityLabel })}
          </h2>
          <p className="home-seo-text">{t('weekendFlightsFrom.seoBlock', { city: cityLabel })}</p>

          <SeoDestinationLinks
            fromCity={city}
            destinations={topDestinations}
            allCities={allCities}
            language={i18n.language}
          />

          <SeoHubLinks allCities={allCities} language={i18n.language} excludeCode={city.code} />

          <p className="home-seo-links">
            <LocalizedLink to="/cheapest-weekend">{t('weekendFlightsFrom.seeAlsoCheapest')}</LocalizedLink>
            {' · '}
            <LocalizedLink to="/single-day-trips">{t('weekendFlightsFrom.seeAlsoDayTrips')}</LocalizedLink>
            {' · '}
            <LocalizedLink to={dayTripsFromPath(city)}>
              {t('weekendFlightsFrom.seeAlsoDayTripsFromCity', { city: cityLabel })}
            </LocalizedLink>
          </p>

          {faqItems.length > 0 ? (
            <div className="faq-list">
              <h3 className="home-seo-title">{t('weekendFlightsFrom.faqTitle', { city: cityLabel })}</h3>
              {faqItems.map(item => (
                <section key={item.q} className="faq-item">
                  <h2>{item.q}</h2>
                  <p>{item.a}</p>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
