import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { FlightCard } from '../components/FlightCard';
import { FlightListSkeleton } from '../components/FlightListSkeleton';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { ResultsViewToggle } from '../components/ResultsViewToggle';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { OriginCityGrid } from '../components/OriginCityGrid';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SeoOriginLinks } from '../components/SeoOriginLinks';
import { SiteFooter } from '../components/SiteFooter';
import { WeekendPicker } from '../components/WeekendPicker';
import { LocalizedLink } from '../components/LocalizedLink';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightSearch } from '../hooks/useFlightSearch';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useJsonLd } from '../hooks/useJsonLd';
import { indexableLocalesForOrigin, preferredIndexableLocale } from '../config/cityIndexLocales';
import { useLocale, useLocalizedPath } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useResultsViewMode } from '../hooks/useResultsViewMode';
import { useWeekendPatterns } from '../hooks/useWeekendPatterns';
import { SEO_HUB_CITIES } from '../data/seoHubCities';
import { useSeoPageContent } from '../hooks/useSeoPageContent';
import { getTopOrigins } from '../services/api';
import { findCityByCode } from '../services/locationPrefill';
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
import { getCityDisplayName } from '../utils/cityDisplayName';
import {
  buildCitySlug,
  parseCityCodeFromSlug,
  weekendFlightsFromPath,
  weekendFlightsToPath
} from '../utils/citySlug';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { typicalHopRange } from '../utils/routeFacts';
import { SEO_PAGE_TYPES } from '../utils/seoPageContent';
import { breadcrumbListJsonLd, faqPageJsonLd } from '../utils/seoSchema';
import type { City, OriginDestination } from '../types/city';
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

export function WeekendFlightsToCityPage() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { path } = useLocalizedPath();
  const weekendPatterns = useWeekendPatterns();
  const parsedCode = parseCityCodeFromSlug(citySlug);

  const {
    allCities,
    citiesByCode,
    nearbyCities,
    selectedCodes,
    setSelectedCodes,
    localizeCityCodes,
    locating,
    errorMessage
  } = useDeparturePrefill({
    localizeCodes: parsedCode ? [parsedCode] : null
  });

  const city = useMemo(
    () => (parsedCode ? findCityByCode(allCities, parsedCode) : undefined),
    [allCities, parsedCode]
  );

  const cityLabel = city ? getCityDisplayName(city, locale) : '';
  const metaCity = cityLabel || parsedCode || '';
  const indexLocales = useMemo(
    () => indexableLocalesForOrigin(parsedCode, city?.country),
    [parsedCode, city?.country]
  );
  const uniqueContent = useSeoPageContent(SEO_PAGE_TYPES.weekendTo, parsedCode, undefined, locale);

  usePageMeta(
    t('meta.weekendFlightsTo.title', { city: metaCity }),
    uniqueContent?.metaDescription || t('meta.weekendFlightsTo.description', { city: metaCity }),
    city ? weekendFlightsToPath(city) : '/404',
    { indexLocales }
  );

  const [topOrigins, setTopOrigins] = useState<OriginDestination[]>([]);

  useEffect(() => {
    if (!parsedCode) return;
    let cancelled = false;

    void getTopOrigins(parsedCode).then(
      origins => {
        if (!cancelled) setTopOrigins(origins);
      },
      () => undefined
    );

    return () => {
      cancelled = true;
    };
  }, [parsedCode]);

  const [selectedPatternIds, setSelectedPatternIds] = useState<WeekendPatternId[]>([]);
  const [eveningFilters, setEveningFilters] = useState(NO_EVENING_FILTERS);
  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedWeekendIds, setSelectedWeekendIds] = useState<string[]>([]);
  const [selectedRangeMonths, setSelectedRangeMonths] = useState<number | null>(DEFAULT_WEEKEND_MONTHS);
  const [resultsView, setResultsView] = useResultsViewMode();

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
    destinationCode: parsedCode,
    weekends,
    selectedWeekendIds,
    selectedPatterns,
    eveningFilters,
    passengerCount,
    locating
  });

  const resultsResetKey = `${parsedCode}|${selectedCodes.slice().sort().join(',')}|${selectedWeekendIds.slice().sort().join('|')}`;
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

  const priceHint = useMemo(() => {
    const priced = topOrigins.filter(origin => origin.minPrice > 0);
    if (priced.length === 0) return null;
    return {
      minPrice: Math.min(...priced.map(origin => origin.minPrice)),
      originCount: topOrigins.length
    };
  }, [topOrigins]);

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
    hasLegFilter,
    visibleFlights.length,
    totalCount,
    t
  ]);

  const faqItems = useMemo(() => {
    if (uniqueContent?.faq?.length) return uniqueContent.faq;
    if (!cityLabel) return [];
    return (t('weekendFlightsTo.faq', { city: cityLabel, returnObjects: true }) as Array<{
      q: string;
      a: string;
    }>) ?? [];
  }, [cityLabel, t, uniqueContent]);

  const hopRange = useMemo(() => {
    if (!city) return null;
    const fromApi = topOrigins
      .map(origin => findCityByCode(allCities, origin.code))
      .filter((item): item is City => item != null);
    const originCities = fromApi.length > 0 ? fromApi : SEO_HUB_CITIES;
    return typicalHopRange(city, originCities);
  }, [city, topOrigins, allCities]);

  useJsonLd(faqItems.length > 0 ? faqPageJsonLd(faqItems) : null);

  const breadcrumbJsonLd = useMemo(() => {
    if (!city) return null;
    return breadcrumbListJsonLd([
      { name: t('nav.home'), path: path('/') },
      { name: t('weekendFlightsTo.tagline', { city: cityLabel }), path: path(weekendFlightsToPath(city)) }
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
    return <Navigate to={path(weekendFlightsToPath(city))} replace />;
  }

  return (
    <>
      <AppHeader />

      <section className="home-intro">
        <div className="intro-overlay">
          <div className="container container-wide intro-copy">
            <p className="intro-eyebrow">{t('weekendFlightsTo.tagline', { city: cityLabel })}</p>
            <h1>{t('weekendFlightsTo.title', { city: cityLabel })}</h1>
            <p className="intro-subtitle">{t('weekendFlightsTo.subtitle', { city: cityLabel })}</p>
            <p className="intro-lead">
              {uniqueContent?.lead || t('weekendFlightsTo.lead', { city: cityLabel })}
            </p>
            {priceHint ? (
              <p className="intro-lead">
                {t('weekendFlightsTo.priceHint', {
                  city: cityLabel,
                  minPrice: Math.round(priceHint.minPrice),
                  originCount: priceHint.originCount
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
                    selectedCodes={selectedCodes}
                    locating={locating}
                    locationLabel={locationLabel}
                    onSelectedCodesChange={setSelectedCodes}
                    onAddCity={handleAddCity}
                    allowEmpty
                    reserveChipSlot
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
                {t('weekendFlightsTo.intoCity', { city: cityLabel })}
                {locationLabel
                  ? ` · ${t('home.fromSelectedAirports', { airports: locationLabel })}`
                  : ` · ${t('weekendFlightsTo.allOrigins')}`}{' '}
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
                  {hasLegFilter || hasTextFilter
                    ? t('home.dealsShown', {
                        shown: filteredFlights.length,
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
                <OriginCityGrid
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
                      onDepartureSelect={selected => handleDepartureLegSelect(flight, selected)}
                      onReturnSelect={selected => handleReturnLegSelect(flight, selected)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="home-seo" aria-labelledby="weekend-to-seo-title">
        <div className="container container-wide">
          <h2 id="weekend-to-seo-title" className="home-seo-title">
            {uniqueContent?.heading || t('weekendFlightsTo.seoTitle', { city: cityLabel })}
          </h2>
          {(uniqueContent?.paragraphs?.length
            ? uniqueContent.paragraphs
            : [t('weekendFlightsTo.seoBlock', { city: cityLabel })]
          ).map(text => (
            <p key={text.slice(0, 48)} className="home-seo-text">
              {text}
            </p>
          ))}
          {uniqueContent?.sourceUrl ? (
            <p className="home-seo-attribution">
              <a href={uniqueContent.sourceUrl} rel="noopener noreferrer">
                {t('seoUnique.attribution')}
              </a>
            </p>
          ) : null}
          {hopRange ? (
            <p className="home-seo-text">
              {hopRange.minMinutes === hopRange.maxMinutes
                ? t('weekendFlightsTo.hopHintSingle', {
                    city: cityLabel,
                    duration: hopRange.minDurationLabel
                  })
                : t('weekendFlightsTo.hopHintRange', {
                    city: cityLabel,
                    durationMin: hopRange.minDurationLabel,
                    durationMax: hopRange.maxDurationLabel
                  })}
            </p>
          ) : null}

          <SeoOriginLinks
            toCity={city}
            origins={topOrigins}
            allCities={allCities}
            language={i18n.language}
          />

          <SeoHubLinks allCities={allCities} language={i18n.language} excludeCode={city.code} />

          <p className="home-seo-links">
            <LocalizedLink to="/cheapest-weekend">{t('weekendFlightsFrom.seeAlsoCheapest')}</LocalizedLink>
            {' · '}
            <LocalizedLink
              locale={preferredIndexableLocale(locale, city.code, city.country)}
              to={weekendFlightsFromPath(city)}
            >
              {t('weekendFlightsTo.seeAlsoFromCity', { city: cityLabel })}
            </LocalizedLink>
          </p>

          {faqItems.length > 0 ? (
            <div className="faq-list">
              <h3 className="home-seo-title">{t('weekendFlightsTo.faqTitle', { city: cityLabel })}</h3>
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
