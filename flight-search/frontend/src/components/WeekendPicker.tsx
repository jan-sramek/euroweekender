import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PassengerPicker } from './PassengerPicker';
import { getIsoWeekNumber, getWeekendIdsForMonths } from '../services/weekend';
import type { EveningFlightFilters } from '../services/weekendFilter';
import type { WeekendOption, WeekendPattern, WeekendPatternId } from '../types/weekend';
import './WeekendPicker.css';

const WEEKEND_RANGE_PRESETS = [1, 3, 6] as const;

interface WeekendPickerProps {
  patterns: WeekendPattern[];
  selectedPatternIds: WeekendPatternId[];
  onSelectedPatternIdsChange: (ids: WeekendPatternId[]) => void;
  eveningFilters: EveningFlightFilters;
  onEveningFiltersChange: (filters: EveningFlightFilters) => void;
  passengerCount: number;
  onPassengerCountChange: (count: number) => void;
  weekends?: WeekendOption[];
  selectedWeekendIds?: string[];
  /** Explicit range preset (1/3/6). Survives trip-type remaps that change weekend ids. */
  selectedRangeMonths?: number | null;
  onWeekendToggle?: (id: string) => void;
  onClearWeekends?: () => void;
  onSelectWeekendMonths?: (months: number) => void;
  showWeekendStrip?: boolean;
}

function EveningIcon() {
  return (
    <svg className="evening-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.2 3.1a1 1 0 0 1 1.1 1.3A7.4 7.4 0 1 0 19.6 16a1 1 0 0 1 1.4 1.1A9.4 9.4 0 1 1 15.2 3.1Z"
      />
      <circle cx="18.2" cy="6.2" r="1.15" fill="currentColor" opacity="0.55" />
      <circle cx="20.6" cy="8.8" r="0.75" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

interface EveningToggleProps {
  active: boolean;
  title: string;
  label: string;
  onClick: () => void;
}

function EveningToggle({ active, title, label, onClick }: EveningToggleProps) {
  return (
    <button
      type="button"
      className={`pattern-pill evening-toggle${active ? ' pattern-pill-active' : ''}`}
      aria-pressed={active}
      title={title}
      onClick={onClick}
    >
      <span className="evening-toggle-icon-wrap">
        <EveningIcon />
      </span>
      <span className="evening-toggle-text">{label}</span>
    </button>
  );
}

export function WeekendPicker({
  patterns,
  selectedPatternIds,
  onSelectedPatternIdsChange,
  eveningFilters,
  onEveningFiltersChange,
  passengerCount,
  onPassengerCountChange,
  weekends = [],
  selectedWeekendIds = [],
  selectedRangeMonths,
  onWeekendToggle,
  onClearWeekends,
  onSelectWeekendMonths,
  showWeekendStrip = true
}: WeekendPickerProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedPatterns = patterns.filter(pattern => selectedPatternIds.includes(pattern.id));
  const weekendSubLabel =
    selectedPatterns.length === 1 ? selectedPatterns[0].shortLabel : '';

  const inferredRangeMonths = useMemo(() => {
    if (selectedWeekendIds.length === 0) return null;
    const selected = new Set(selectedWeekendIds);
    for (const months of WEEKEND_RANGE_PRESETS) {
      const ids = getWeekendIdsForMonths(weekends, months);
      if (ids.length === 0 || ids.length !== selected.size) continue;
      if (ids.every(id => selected.has(id))) return months;
    }
    return null;
  }, [weekends, selectedWeekendIds]);

  const activeRangeMonths =
    selectedRangeMonths !== undefined ? selectedRangeMonths : inferredRangeMonths;

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    });
  };

  const handlePatternClick = (patternId: WeekendPatternId) => {
    onSelectedPatternIdsChange(
      selectedPatternIds.includes(patternId)
        ? selectedPatternIds.filter(id => id !== patternId)
        : [...selectedPatternIds, patternId]
    );
  };

  const rangeLabel = (months: (typeof WEEKEND_RANGE_PRESETS)[number]) => {
    if (months === 1) return t('search.weekendNextMonth');
    if (months === 3) return t('search.weekendNext3Months');
    return t('search.weekendNext6Months');
  };

  return (
    <div className="weekend-picker">
      {showWeekendStrip && onWeekendToggle ? (
        <div className="weekend-section">
          <div className="weekend-section-header">
            <span className="weekend-section-label">{t('search.travelWeekend')}</span>
            <div className="weekend-section-actions">
              {selectedWeekendIds.length > 0 && onClearWeekends ? (
                <button
                  type="button"
                  className="weekend-clear-btn"
                  onClick={onClearWeekends}
                >
                  {t('search.clearWeekends')}
                </button>
              ) : null}
              <span className="weekend-section-hint">{t('search.travelWeekendHint')}</span>
            </div>
          </div>

          {onSelectWeekendMonths ? (
            <div className="weekend-range-presets" role="group" aria-label={t('search.selectWeekends')}>
              {WEEKEND_RANGE_PRESETS.map(months => {
                const active = activeRangeMonths === months;
                return (
                  <button
                    key={months}
                    type="button"
                    className={`weekend-range-btn${active ? ' weekend-range-btn-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onSelectWeekendMonths(months)}
                  >
                    {rangeLabel(months)}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="weekend-dates-row">
            <div className="weekend-track" ref={scrollRef} role="group" aria-label={t('search.selectWeekends')}>
              {weekends.map(weekend => {
                const active = selectedWeekendIds.includes(weekend.id);
                const weekLabel = t('search.isoWeek', { week: getIsoWeekNumber(weekend.departDate) });
                return (
                  <button
                    key={weekend.id}
                    type="button"
                    className={`weekend-pill${active ? ' weekend-pill-active' : ''}`}
                    aria-pressed={active}
                    aria-label={`${weekLabel}, ${weekend.shortLabel}`}
                    onClick={() => onWeekendToggle(weekend.id)}
                  >
                    <span className="weekend-week">{weekLabel}</span>
                    <span className="weekend-range">{weekend.shortLabel}</span>
                    <span className={`weekend-sub${weekendSubLabel ? '' : ' weekend-sub-placeholder'}`}>
                      {weekendSubLabel || '\u00A0'}
                    </span>
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
      ) : null}

      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('search.tripType')}</span>
          <span className="weekend-section-hint">{t('search.tripTypeHint')}</span>
        </div>

        <div className="pattern-track" role="group" aria-label={t('search.selectTripType')}>
          {patterns.map(pattern => {
            const active = selectedPatternIds.includes(pattern.id);
            return (
              <button
                key={pattern.id}
                type="button"
                className={`pattern-pill${active ? ' pattern-pill-active' : ''}`}
                aria-pressed={active}
                title={pattern.label}
                onClick={() => handlePatternClick(pattern.id)}
              >
                {pattern.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('search.departureTime')}</span>
          <span className="weekend-section-hint">{t('search.departureTimeHint')}</span>
        </div>

        <div className="pattern-track" role="group" aria-label={t('search.eveningDepartures')}>
          <EveningToggle
            active={eveningFilters.outboundEvening}
            label={t('search.thereEvening')}
            title={t('search.thereEveningTitle')}
            onClick={() =>
              onEveningFiltersChange({
                ...eveningFilters,
                outboundEvening: !eveningFilters.outboundEvening
              })
            }
          />
          <EveningToggle
            active={eveningFilters.returnEvening}
            label={t('search.backEvening')}
            title={t('search.backEveningTitle')}
            onClick={() =>
              onEveningFiltersChange({
                ...eveningFilters,
                returnEvening: !eveningFilters.returnEvening
              })
            }
          />
        </div>
      </div>

      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('search.travelers')}</span>
          <span className="weekend-section-hint">{t('search.travelersHint')}</span>
        </div>

        <PassengerPicker count={passengerCount} onChange={onPassengerCountChange} />
      </div>
    </div>
  );
}
