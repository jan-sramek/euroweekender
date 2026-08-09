import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { DayTripCalendar } from '../components/DayTripCalendar';
import { DeparturePicker } from '../components/DeparturePicker';
import { FlightCard } from '../components/FlightCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { PassengerPicker } from '../components/PassengerPicker';
import { SiteFooter } from '../components/SiteFooter';
import { useDayTripSearch } from '../hooks/useDayTripSearch';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  DAY_TRIP_OPTIONS_MONTHS,
  DAY_TRIP_RANGE_PRESETS,
  getDayTripIdsForMonths,
  getDefaultDayTripIds,
  getUpcomingDayTripOptions
} from '../services/dayTrip';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { getDepartureLegKey, getReturnLegKey } from '../utils/flightLeg';
import type { City } from '../types/city';
import '../components/WeekendPicker.css';
import './HomePage.css';
import './SingleDayTripsPage.css';

export function SingleDayTripsPage() {
  const { t, i18n } = useTranslation();
  const now = new Date();

  usePageMeta(
    t('meta.singleDayTrips.title'),
    t('meta.singleDayTrips.description'),
    '/single-day-trips'
  );

  const [passengerCount, setPassengerCount] = useState(1);
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const defaultsApplied = useRef(false);

  const days = useMemo(
    () => getUpcomingDayTripOptions(DAY_TRIP_OPTIONS_MONTHS, i18n.language),
    [i18n.language]
  );

  useEffect(() => {
    if (defaultsApplied.current || days.length === 0) return;
    defaultsApplied.current = true;
    setSelectedDayIds(getDefaultDayTripIds(days, 1));
  }, [days]);

  const {
    allCities,
    nearbyCities,
    popularHubCities,
    selectedCodes,
    setSelectedCodes,
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

  const handleSelectMonths = (months: number) => {
    setSelectedDayIds(getDayTripIdsForMonths(days, months));
  };

  const rangeLabel = (months: (typeof DAY_TRIP_RANGE_PRESETS)[number]) => {
    if (months === 1) return t('search.weekendNextMonth');
    if (months === 3) return t('search.weekendNext3Months');
    return t('search.weekendNext6Months');
  };

  const handleAddCity = (city: City) => {
    setSelectedCodes(prev => (prev.includes(city.code) ? prev : [...prev, city.code]));
  };

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
              <div className="single-day-layout">
                <div className="single-day-controls">
                  <div className="searchbar single-day-searchbar">
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

                <div className="single-day-calendar-wrap">
                  <DayTripCalendar
                    year={viewYear}
                    month={viewMonth}
                    days={days}
                    selectedDayIds={selectedDayIds}
                    onMonthChange={(year, month) => {
                      setViewYear(year);
                      setViewMonth(month);
                    }}
                    onSelectedDayIdsChange={setSelectedDayIds}
                  />
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
          ) : (
            <div className="flight-list">
              {hasLegFilter ? (
                <p className="offers-subtitle">
                  {t('home.flightsCounterFiltered', {
                    shown: visibleFlights.length,
                    total: flights.length
                  })}{' '}
                  <button type="button" className="link-button" onClick={clearLegFilters}>
                    {t('home.clearLegFilters')}
                  </button>
                </p>
              ) : null}
              {visibleFlights.map(flight => (
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

      <SiteFooter />
    </>
  );
}
