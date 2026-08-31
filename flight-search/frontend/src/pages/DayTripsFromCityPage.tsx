import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DayTripPicker } from '../components/DayTripPicker';
import { DeparturePicker } from '../components/DeparturePicker';
import { DestinationCityGrid } from '../components/DestinationCityGrid';
import { FlightCard } from '../components/FlightCard';
import { FlightListSkeleton } from '../components/FlightListSkeleton';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { HomeEmptyDeals } from '../components/HomeEmptyDeals';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ResultsViewToggle } from '../components/ResultsViewToggle';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SiteFooter } from '../components/SiteFooter';
import { LocalizedLink } from '../components/LocalizedLink';
import { useDayTripSearch } from '../hooks/useDayTripSearch';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useJsonLd } from '../hooks/useJsonLd';
import { indexableLocalesForOrigin, preferredIndexableLocale } from '../config/cityIndexLocales';
import { useLocale, useLocalizedPath } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import { useSeoPageContent } from '../hooks/useSeoPageContent';
import { useResultsViewMode } from '../hooks/useResultsViewMode';
import {
  DAY_TRIP_OPTIONS_MONTHS,
  getDayTripIdsForMonths,
  getDefaultDayTripIds,
  getUpcomingDayTripOptions
} from '../services/dayTrip';
import { findCityByCode } from '../services/locationPrefill';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { buildCitySlug, dayTripsFromPath, parseCityCodeFromSlug, weekendFlightsFromPath } from '../utils/citySlug';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { SEO_PAGE_TYPES } from '../utils/seoPageContent';
import { breadcrumbListJsonLd, faqPageJsonLd } from '../utils/seoSchema';
import type { City } from '../types/city';
import { NotFoundPage } from './NotFoundPage';
import '../layouts/ContentPageLayout.css';
import './HomePage.css';

export function DayTripsFromCityPage() {
  const { t, i18n } = useTranslation();
  const locale = useLocale();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { path } = useLocalizedPath();
  const parsedCode = parseCityCodeFromSlug(citySlug);
  const preferredCodes = useMemo(() => (parsedCode ? [parsedCode] : null), [parsedCode]);

  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [selectedRangeMonths, setSelectedRangeMonths] = useState<number | null>(
    DAY_TRIP_OPTIONS_MONTHS
  );
  const [longDay, setLongDay] = useState(false);
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
  } = useDeparturePrefill({ preferredCodes });

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
  const uniqueContent = useSeoPageContent(SEO_PAGE_TYPES.dayTripsFrom, parsedCode, undefined, locale);

  usePageMeta(
    t('meta.dayTripsFrom.title', { city: metaCity }),
    uniqueContent?.metaDescription || t('meta.dayTripsFrom.description', { city: metaCity }),
    city ? dayTripsFromPath(city) : '/404',
    { indexLocales }
  );

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
    locating,
    longDay
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

  const locationLabel = useMemo(() => {
    const active = selectedCodes
      .map(code => allCities.find(c => c.code === code))
      .filter((c): c is City => c !== undefined);
    if (active.length === 0) return '';
    if (active.length === 1) {
      return `${getCityDisplayName(active[0], locale)} (${active[0].code})`;
    }
    return t('home.moreAirports', {
      name: getCityDisplayName(active[0], locale),
      count: active.length - 1
    });
  }, [allCities, selectedCodes, locale, t]);

  const daysLabel = useMemo(() => {
    if (selectedDays.length === 0) return '';
    if (selectedDays.length > 3) {
      return t('singleDayTrips.daysCount', { count: selectedDays.length });
    }
    return selectedDays.map(day => day.shortLabel).join(', ');
  }, [selectedDays, t]);

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

  const handleAddCity = (nextCity: City) => {
    setSelectedCodes(prev => (prev.includes(nextCity.code) ? prev : [...prev, nextCity.code]));
  };

  const flightsCounterLabel = useMemo(() => {
    if (selectedDays.length === 0) return null;
    if (loadingFlights) {
      return t('home.flightsCounterSearching');
    }
    if (hasLegFilter) {
      return t('home.flightsCounterFiltered', {
        shown: visibleFlights.length,
        total: flights.length
      });
    }
    return t('home.flightsCounter', { count: flights.length });
  }, [
    selectedDays.length,
    loadingFlights,
    flights.length,
    hasLegFilter,
    visibleFlights.length,
    t
  ]);

  const faqItems = useMemo(() => {
    if (uniqueContent?.faq?.length) return uniqueContent.faq;
    if (!cityLabel) return [];
    return (t('dayTripsFrom.faq', { city: cityLabel, returnObjects: true }) as Array<{
      q: string;
      a: string;
    }>) ?? [];
  }, [cityLabel, t, uniqueContent]);

  useJsonLd(faqItems.length > 0 ? faqPageJsonLd(faqItems) : null);

  const breadcrumbJsonLd = useMemo(() => {
    if (!city) return null;
    return breadcrumbListJsonLd([
      { name: t('nav.home'), path: path('/') },
      { name: t('dayTripsFrom.tagline', { city: cityLabel }), path: path(dayTripsFromPath(city)) }
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
    return <Navigate to={path(dayTripsFromPath(city))} replace />;
  }

  return (
    <>
      <AppHeader />

      <section className="home-intro">
        <div className="intro-overlay">
          <div className="container container-wide intro-copy">
            <p className="intro-eyebrow">{t('dayTripsFrom.tagline', { city: cityLabel })}</p>
            <h1>{t('dayTripsFrom.title', { city: cityLabel })}</h1>
            <p className="intro-subtitle">{t('dayTripsFrom.subtitle', { city: cityLabel })}</p>
            <p className="intro-lead">
              {uniqueContent?.lead || t('dayTripsFrom.lead', { city: cityLabel })}
            </p>
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
                    longDay={longDay}
                    onLongDayChange={setLongDay}
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
                {t('singleDayTrips.scheduleSummary')}
                {longDay ? ` · ${t('singleDayTrips.longDaySummary')}` : ''} · {daysLabel}
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
                        total: flights.length
                      })
                    : t('home.dealsFound', { count: flights.length })}
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

      <section className="home-seo" aria-labelledby="day-trips-from-seo-title">
        <div className="container container-wide">
          <h2 id="day-trips-from-seo-title" className="home-seo-title">
            {uniqueContent?.heading || t('dayTripsFrom.seoTitle', { city: cityLabel })}
          </h2>
          {(uniqueContent?.paragraphs?.length
            ? uniqueContent.paragraphs
            : [t('dayTripsFrom.seoBlock', { city: cityLabel })]
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

          <SeoHubLinks
            allCities={allCities}
            language={i18n.language}
            excludeCode={city.code}
            variant="dayTrips"
          />

          <p className="home-seo-links">
            <LocalizedLink to="/cheapest-weekend">{t('weekendFlightsFrom.seeAlsoCheapest')}</LocalizedLink>
            {' · '}
            <LocalizedLink
              locale={preferredIndexableLocale(locale, city.code, city.country)}
              to={weekendFlightsFromPath(city)}
            >
              {t('dayTripsFrom.seeAlsoWeekendFromCity', { city: cityLabel })}
            </LocalizedLink>
          </p>

          {faqItems.length > 0 ? (
            <div className="faq-list">
              <h3 className="home-seo-title">{t('dayTripsFrom.faqTitle', { city: cityLabel })}</h3>
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
