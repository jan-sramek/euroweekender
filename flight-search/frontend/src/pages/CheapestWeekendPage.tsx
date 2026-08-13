import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { DestinationPicker } from '../components/DestinationPicker';
import { WeekendPicker } from '../components/WeekendPicker';
import { WeekendPriceCalendar } from '../components/WeekendPriceCalendar';
import { FlightCard } from '../components/FlightCard';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { RouteSeoFacts } from '../components/RouteSeoFacts';
import { SiteFooter } from '../components/SiteFooter';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useDestinationWeekendSearch } from '../hooks/useDestinationWeekendSearch';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useLocale } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useWeekendPatterns } from '../hooks/useWeekendPatterns';
import {
  findMatchingWeekendId,
  getWeekendOptions,
  getWeekendPattern,
  getWeekendsForMonth
} from '../services/weekend';
import { NO_EVENING_FILTERS } from '../services/weekendFilter';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import {
  cheapestMonthFromWeekendPrices,
  computeRouteFactsFromCities,
  formatMonthName
} from '../utils/routeFacts';
import type { City } from '../types/city';
import type { WeekendPatternId } from '../types/weekend';
import './HomePage.css';
import './CheapestWeekendPage.css';

/** Horizon used for flight search + calendar heat-scale (independent of visible month). */
const CALENDAR_PRICE_HORIZON_WEEKENDS = 52;

function readAirportParam(value: string | null): string | null {
  const code = value?.trim().toUpperCase() ?? '';
  return code.length > 0 ? code : null;
}

interface CheapestWeekendPageProps {
  /** Preselect + default the departure airport (e.g. from an OD landing page). */
  forcedFrom?: string;
  /** Preselect + default the destination city (e.g. from an OD landing page). */
  forcedTo?: string;
  /** Canonical route path used for <link rel="canonical"> and hreflang tags. */
  routePath?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageTagline?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  pageLead?: string;
  seoHeading?: string;
  /** Extra SEO content (links, breadcrumbs, etc.) rendered inside the SEO section. */
  extraSeoContent?: ReactNode;
}

export function CheapestWeekendPage({
  forcedFrom,
  forcedTo,
  routePath,
  metaTitle,
  metaDescription,
  pageTagline,
  pageTitle,
  pageSubtitle,
  pageLead,
  seoHeading,
  extraSeoContent
}: CheapestWeekendPageProps = {}) {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const [searchParams] = useSearchParams();
  const weekendPatterns = useWeekendPatterns();

  usePageMeta(
    metaTitle ?? t('meta.cheapestWeekend.title'),
    metaDescription ?? t('meta.cheapestWeekend.description'),
    routePath ?? '/cheapest-weekend'
  );

  const fromParam = forcedFrom?.trim().toUpperCase() || readAirportParam(searchParams.get('from'));
  const toParam = forcedTo?.trim().toUpperCase() || readAirportParam(searchParams.get('to'));
  const preferredCodes = useMemo(() => (fromParam ? [fromParam] : null), [fromParam]);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedPatternId, setSelectedPatternId] = useState<WeekendPatternId | null>(null);
  const [eveningFilters, setEveningFilters] = useState(NO_EVENING_FILTERS);
  const [passengerCount, setPassengerCount] = useState(1);
  const [destinationCode, setDestinationCode] = useState<string | null>(toParam);
  const [selectedWeekendId, setSelectedWeekendId] = useState<string | null>(null);
  const [singleOriginReady, setSingleOriginReady] = useState(false);

  const selectedPattern = useMemo(
    () => (selectedPatternId ? getWeekendPattern(selectedPatternId) : null),
    [selectedPatternId]
  );
  const translatedSelectedPattern = useMemo(
    () => weekendPatterns.find(pattern => pattern.id === selectedPatternId) ?? null,
    [weekendPatterns, selectedPatternId]
  );

  const yearWeekends = useMemo(
    () => getWeekendOptions(selectedPatternId, CALENDAR_PRICE_HORIZON_WEEKENDS),
    [selectedPatternId]
  );

  const nextViewMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextViewYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const weekends = useMemo(() => {
    const first = getWeekendsForMonth(selectedPatternId, viewYear, viewMonth);
    const second = getWeekendsForMonth(selectedPatternId, nextViewYear, nextViewMonth);
    const seen = new Set(first.map(weekend => weekend.id));
    return [...first, ...second.filter(weekend => !seen.has(weekend.id))];
  }, [selectedPatternId, viewYear, viewMonth, nextViewYear, nextViewMonth]);

  const {
    allCities,
    citiesByCode,
    selectedCodes,
    setSelectedCodes,
    localizeCityCodes,
    locating,
    errorMessage
  } = useDeparturePrefill({
    preferredCodes,
    localizeCodes: destinationCode ? [destinationCode] : null
  });

  useEffect(() => {
    if (!toParam || allCities.length === 0) return;
    if (allCities.some(city => city.code === toParam)) {
      setDestinationCode(toParam);
    }
  }, [toParam, allCities]);

  // Keep exactly one departure airport for this page.
  useEffect(() => {
    if (locating) return;
    if (selectedCodes.length > 1) {
      setSelectedCodes([selectedCodes[0]]);
      return;
    }
    setSingleOriginReady(true);
  }, [locating, selectedCodes, setSelectedCodes]);

  const fromCode = selectedCodes[0] ?? null;

  useEffect(() => {
    setSelectedWeekendId(prev => {
      if (!prev) return null;
      const matched = findMatchingWeekendId(weekends, prev);
      return weekends.some(weekend => weekend.id === matched) ? matched : null;
    });
  }, [weekends]);

  const {
    flights,
    visibleFlights,
    pricesByWeekendId,
    loadingFlights,
    flightError,
    hasLegFilter,
    loadFlights,
    handleDepartureLegSelect,
    handleReturnLegSelect,
    clearLegFilters,
    departureLegFilter,
    returnLegFilter,
    selectedWeekend
  } = useDestinationWeekendSearch({
    fromCode,
    toCode: destinationCode,
    weekends: yearWeekends,
    selectedWeekendId,
    selectedPattern,
    eveningFilters,
    passengerCount,
    locating: locating || !singleOriginReady
  });

  const resultsResetKey = `${fromCode ?? ''}|${destinationCode ?? ''}|${selectedWeekendId ?? ''}`;
  const {
    query: resultsQuery,
    setQuery: setResultsQuery,
    filteredFlights,
    hasTextFilter
  } = useFlightTextFilter(visibleFlights, resultsResetKey, citiesByCode);

  useEffect(() => {
    localizeCityCodes(visibleFlights.flatMap(flight => [flight.cityCodeFrom, flight.cityCodeTo]));
  }, [localizeCityCodes, visibleFlights]);

  const fromCity = useMemo(
    () => (fromCode ? allCities.find(city => city.code === fromCode) ?? null : null),
    [allCities, fromCode]
  );
  const toCity = useMemo(
    () =>
      destinationCode ? allCities.find(city => city.code === destinationCode) ?? null : null,
    [allCities, destinationCode]
  );

  const locationLabel = fromCity
    ? `${getCityDisplayName(fromCity, locale)} (${fromCity.code})`
    : '';

  const handleAddCity = (city: City) => {
    setSelectedCodes([city.code]);
  };

  const handleMonthChange = (year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
    setSelectedWeekendId(null);
  };

  const canSearch = Boolean(fromCode && destinationCode);
  const totalCount = flights.length;
  const isOdLanding = Boolean(forcedFrom && forcedTo);
  const fromLabel = fromCity ? getCityDisplayName(fromCity, locale) : '';
  const toLabel = toCity ? getCityDisplayName(toCity, locale) : '';
  const routeFacts = useMemo(
    () => (isOdLanding ? computeRouteFactsFromCities(fromCity, toCity) : null),
    [isOdLanding, fromCity, toCity]
  );
  const cheapestMonth = useMemo(() => {
    if (!isOdLanding) return null;
    const month = cheapestMonthFromWeekendPrices(yearWeekends, pricesByWeekendId);
    return month ? formatMonthName(month, i18n.language) : null;
  }, [isOdLanding, yearWeekends, pricesByWeekendId, i18n.language]);

  return (
    <>
      <AppHeader />

      <section className="home-intro">
        <div className="intro-overlay">
          <div className="container container-wide intro-copy">
            <p className="intro-eyebrow">{pageTagline ?? t('cheapestWeekend.tagline')}</p>
            <h1>{pageTitle ?? t('cheapestWeekend.title')}</h1>
            <p className="intro-subtitle">{pageSubtitle ?? t('cheapestWeekend.subtitle')}</p>
            <p className="intro-lead">{pageLead ?? t('cheapestWeekend.lead')}</p>
          </div>

          <div className="search-home">
            <div className="container container-wide">
              <div className="searchbar cheapest-searchbar">
                <div className="search-field search-from">
                  <p className="search-field-label">{t('cheapestWeekend.from')}</p>
                  <DeparturePicker
                    allCities={allCities}
                    nearbyCities={[]}
                    selectedCodes={selectedCodes.slice(0, 1)}
                    locating={locating}
                    locationLabel={locationLabel}
                    onSelectedCodesChange={codes => setSelectedCodes(codes.slice(0, 1))}
                    onAddCity={handleAddCity}
                    singleSelect
                    reserveChipSlot
                    showNearbyAirports={false}
                  />
                </div>

                <div className="search-field search-to">
                  <p className="search-field-label">{t('cheapestWeekend.to')}</p>
                  <DestinationPicker
                    allCities={allCities}
                    originCity={fromCity}
                    excludeCode={fromCode}
                    selectedCode={destinationCode}
                    onSelectedCodeChange={code => {
                      setDestinationCode(code);
                      setSelectedWeekendId(null);
                    }}
                    reserveChipSlot
                    onLocalizeCodes={localizeCityCodes}
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
                    showWeekendStrip={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="offers-home cheapest-offers">
        <div className="container container-wide">
          {errorMessage ? (
            <div className="alert alert-warning" role="status">
              {errorMessage}
            </div>
          ) : null}

          {!canSearch ? (
            <div className="state-box">{t('cheapestWeekend.pickAirports')}</div>
          ) : (
            <>
              <div className="cheapest-calendar-wrap">
                {fromCity && toCity ? (
                  <p className="offers-subtitle cheapest-route">
                    {t('cheapestWeekend.routeSummary', {
                      from: `${getCityDisplayName(fromCity, locale)} (${fromCity.code})`,
                      to: `${getCityDisplayName(toCity, locale)} (${toCity.code})`
                    })}
                    {' · '}
                    {passengerCount}{' '}
                    {passengerCount === 1 ? t('home.person') : t('home.persons')}
                    {' · '}
                    {translatedSelectedPattern
                      ? translatedSelectedPattern.label
                      : t('home.allTripTypes')}
                    {eveningFilters.outboundEvening ? ` · ${t('home.thereEvening')}` : ''}
                    {eveningFilters.returnEvening ? ` · ${t('home.backEvening')}` : ''}
                  </p>
                ) : null}

                <WeekendPriceCalendar
                  year={viewYear}
                  month={viewMonth}
                  weekends={weekends}
                  pricesByWeekendId={pricesByWeekendId}
                  selectedWeekendId={selectedWeekendId}
                  onMonthChange={handleMonthChange}
                  onWeekendSelect={setSelectedWeekendId}
                  loading={loadingFlights}
                />
              </div>

              {flightError ? (
                <div className="alert alert-error" role="alert">
                  {flightError}{' '}
                  <button type="button" className="link-button" onClick={() => void loadFlights()}>
                    {t('home.tryAgain')}
                  </button>
                </div>
              ) : null}

              {!selectedWeekend ? (
                <div className="state-box">{t('cheapestWeekend.selectWeekend')}</div>
              ) : loadingFlights && flights.length === 0 ? (
                <div className="state-box state-box-loading">
                  <LoadingIndicator size="md" label={t('home.loading')} />
                </div>
              ) : flights.length === 0 ? (
                <div className="state-box">{t('cheapestWeekend.noFlights')}</div>
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
                      {' · '}
                      {selectedWeekend.shortLabel}
                    </p>
                    {hasLegFilter && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={clearLegFilters}
                      >
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
            </>
          )}
        </div>
      </section>

      <section className="home-seo" aria-labelledby="cheapest-seo-title">
        <div className="container container-wide">
          <h2 id="cheapest-seo-title" className="home-seo-title">
            {seoHeading ?? t('cheapestWeekend.seoTitle')}
          </h2>
          {isOdLanding && routeFacts && fromLabel && toLabel ? (
            <RouteSeoFacts
              fromLabel={fromLabel}
              toLabel={toLabel}
              facts={routeFacts}
              cheapestMonth={cheapestMonth}
            />
          ) : null}
          {isOdLanding ? null : <p className="home-seo-text">{t('cheapestWeekend.seoBlock')}</p>}
          {extraSeoContent}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
