import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DeparturePicker } from '../components/DeparturePicker';
import { FlightCard } from '../components/FlightCard';
import { FlightResultsSearch } from '../components/FlightResultsSearch';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { PassengerPicker } from '../components/PassengerPicker';
import { SeoHubLinks } from '../components/SeoHubLinks';
import { SiteFooter } from '../components/SiteFooter';
import { LocalizedLink } from '../components/LocalizedLink';
import { useDayTripSearch } from '../hooks/useDayTripSearch';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useFlightTextFilter } from '../hooks/useFlightTextFilter';
import { useJsonLd } from '../hooks/useJsonLd';
import { useLocalizedPath } from '../hooks/useLocale';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  DAY_TRIP_OPTIONS_MONTHS,
  DAY_TRIP_RANGE_PRESETS,
  getDayTripIdsForMonths,
  getDefaultDayTripIds,
  getUpcomingDayTripOptions
} from '../services/dayTrip';
import { findCityByCode } from '../services/locationPrefill';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { buildCitySlug, dayTripsFromPath, parseCityCodeFromSlug, weekendFlightsFromPath } from '../utils/citySlug';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import { breadcrumbListJsonLd, faqPageJsonLd } from '../utils/seoSchema';
import type { City } from '../types/city';
import { NotFoundPage } from './NotFoundPage';
import '../components/WeekendPicker.css';
import '../layouts/ContentPageLayout.css';
import './HomePage.css';

export function DayTripsFromCityPage() {
  const { t, i18n } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { path } = useLocalizedPath();
  const parsedCode = parseCityCodeFromSlug(citySlug);
  const preferredCodes = useMemo(() => (parsedCode ? [parsedCode] : null), [parsedCode]);

  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const defaultsApplied = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    nearbyCities,
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
    t('meta.dayTripsFrom.title', { city: metaCity }),
    t('meta.dayTripsFrom.description', { city: metaCity }),
    city ? dayTripsFromPath(city) : '/404'
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
    locating
  });

  const resultsResetKey = `${selectedCodes.slice().sort().join(',')}|${selectedDayIds.slice().sort().join('|')}`;
  const {
    query: resultsQuery,
    setQuery: setResultsQuery,
    filteredFlights,
    hasTextFilter
  } = useFlightTextFilter(visibleFlights, resultsResetKey);

  const locationLabel = useMemo(() => {
    const active = selectedCodes
      .map(code => allCities.find(c => c.code === code))
      .filter((c): c is City => c !== undefined);
    if (active.length === 0) return '';
    if (active.length === 1) {
      return `${getCityDisplayName(active[0], i18n.language)} (${active[0].code})`;
    }
    return t('home.moreAirports', {
      name: getCityDisplayName(active[0], i18n.language),
      count: active.length - 1
    });
  }, [allCities, selectedCodes, i18n.language, t]);

  const daysLabel = useMemo(() => {
    if (selectedDays.length === 0) return '';
    if (selectedDays.length > 3) {
      return t('singleDayTrips.daysCount', { count: selectedDays.length });
    }
    return selectedDays.map(day => day.shortLabel).join(', ');
  }, [selectedDays, t]);

  const activeRangeMonths = useMemo(() => {
    if (selectedDayIds.length === 0) return null;
    const selected = new Set(selectedDayIds);
    for (const months of DAY_TRIP_RANGE_PRESETS) {
      const ids = getDayTripIdsForMonths(days, months);
      if (ids.length === 0 || ids.length !== selected.size) continue;
      if (ids.every(id => selected.has(id))) return months;
    }
    return null;
  }, [days, selectedDayIds]);

  const handleDayToggle = (dayId: string) => {
    setSelectedDayIds(prev => {
      if (prev.includes(dayId)) return prev.filter(id => id !== dayId);
      const next = [...prev, dayId];
      next.sort((a, b) => {
        const dayA = days.find(day => day.id === a);
        const dayB = days.find(day => day.id === b);
        return (dayA?.date.getTime() ?? 0) - (dayB?.date.getTime() ?? 0);
      });
      return next;
    });
  };

  const handleSelectMonths = (months: number) => {
    setSelectedDayIds(getDayTripIdsForMonths(days, months));
  };

  const rangeLabel = (months: (typeof DAY_TRIP_RANGE_PRESETS)[number]) => {
    if (months === 1) return t('search.weekendNextMonth');
    if (months === 3) return t('search.weekendNext3Months');
    return t('search.weekendNext6Months');
  };

  const handleAddCity = (nextCity: City) => {
    setSelectedCodes(prev => (prev.includes(nextCity.code) ? prev : [...prev, nextCity.code]));
  };

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    });
  };

  const faqItems = useMemo(() => {
    if (!cityLabel) return [];
    return (t('dayTripsFrom.faq', { city: cityLabel, returnObjects: true }) as Array<{
      q: string;
      a: string;
    }>) ?? [];
  }, [cityLabel, t]);

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
            <p className="intro-lead">{t('dayTripsFrom.lead', { city: cityLabel })}</p>
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
                  <div className="weekend-picker">
                    <div className="weekend-section">
                      <div className="weekend-section-header">
                        <span className="weekend-section-label">{t('singleDayTrips.travelDay')}</span>
                        <div className="weekend-section-actions">
                          {selectedDayIds.length > 0 ? (
                            <button
                              type="button"
                              className="weekend-clear-btn"
                              onClick={() => setSelectedDayIds([])}
                            >
                              {t('search.clearWeekends')}
                            </button>
                          ) : null}
                          <span className="weekend-section-hint">{t('singleDayTrips.travelDayHint')}</span>
                        </div>
                      </div>

                      <div
                        className="weekend-range-presets"
                        role="group"
                        aria-label={t('singleDayTrips.selectDays')}
                      >
                        {DAY_TRIP_RANGE_PRESETS.map(months => {
                          const active = activeRangeMonths === months;
                          return (
                            <button
                              key={months}
                              type="button"
                              className={`weekend-range-btn${active ? ' weekend-range-btn-active' : ''}`}
                              aria-pressed={active}
                              onClick={() => handleSelectMonths(months)}
                            >
                              {rangeLabel(months)}
                            </button>
                          );
                        })}
                      </div>

                      <div className="weekend-dates-row">
                        <div
                          className="weekend-track"
                          ref={scrollRef}
                          role="group"
                          aria-label={t('singleDayTrips.selectDays')}
                        >
                          {days.map(day => {
                            const active = selectedDayIds.includes(day.id);
                            return (
                              <button
                                key={day.id}
                                type="button"
                                className={`weekend-pill${active ? ' weekend-pill-active' : ''}`}
                                aria-pressed={active}
                                onClick={() => handleDayToggle(day.id)}
                              >
                                <span className="weekend-range">{day.shortLabel}</span>
                                <span className="weekend-sub">{t('singleDayTrips.dayTripTag')}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="weekend-nav">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm nav-btn"
                            onClick={() => scroll('left')}
                            aria-label={t('search.prevWeekends')}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm nav-btn"
                            onClick={() => scroll('right')}
                            aria-label={t('search.nextWeekends')}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="weekend-section">
                      <div className="weekend-section-header">
                        <span className="weekend-section-label">{t('search.travelers')}</span>
                        <span className="weekend-section-hint">{t('search.travelersHint')}</span>
                      </div>
                      <PassengerPicker count={passengerCount} onChange={setPassengerCount} />
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="state-box state-box-loading">
              <LoadingIndicator size="md" label={t('home.loading')} />
            </div>
          ) : flights.length === 0 ? (
            <div className="state-box">{t('singleDayTrips.noFlights')}</div>
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
            <div className="flight-list">
              <FlightResultsSearch value={resultsQuery} onChange={setResultsQuery} />
              {hasLegFilter || hasTextFilter ? (
                <p className="offers-subtitle">
                  {t('home.flightsCounterFiltered', {
                    shown: filteredFlights.length,
                    total: flights.length
                  })}{' '}
                  {hasLegFilter ? (
                    <button type="button" className="link-button" onClick={clearLegFilters}>
                      {t('home.clearLegFilters')}
                    </button>
                  ) : (
                    <button type="button" className="link-button" onClick={() => setResultsQuery('')}>
                      {t('home.clearResultsSearch')}
                    </button>
                  )}
                </p>
              ) : null}
              {filteredFlights.map(flight => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
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
      </section>

      <section className="home-seo" aria-labelledby="day-trips-from-seo-title">
        <div className="container container-wide">
          <h2 id="day-trips-from-seo-title" className="home-seo-title">
            {t('dayTripsFrom.seoTitle', { city: cityLabel })}
          </h2>
          <p className="home-seo-text">{t('dayTripsFrom.seoBlock', { city: cityLabel })}</p>

          <SeoHubLinks
            allCities={allCities}
            language={i18n.language}
            excludeCode={city.code}
            variant="dayTrips"
          />

          <p className="home-seo-links">
            <LocalizedLink to="/cheapest-weekend">{t('weekendFlightsFrom.seeAlsoCheapest')}</LocalizedLink>
            {' · '}
            <LocalizedLink to={weekendFlightsFromPath(city)}>
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
