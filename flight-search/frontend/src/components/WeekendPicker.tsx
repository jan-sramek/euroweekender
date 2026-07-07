import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PassengerPicker } from './PassengerPicker';
import type { EveningFlightFilters } from '../services/weekendFilter';
import type { WeekendOption, WeekendPattern, WeekendPatternId } from '../types/weekend';
import './WeekendPicker.css';

interface WeekendPickerProps {
  patterns: WeekendPattern[];
  selectedPatternId: WeekendPatternId | null;
  onSelectedPatternIdChange: (id: WeekendPatternId | null) => void;
  eveningFilters: EveningFlightFilters;
  onEveningFiltersChange: (filters: EveningFlightFilters) => void;
  passengerCount: number;
  onPassengerCountChange: (count: number) => void;
  weekends: WeekendOption[];
  selectedWeekendIds: string[];
  onWeekendToggle: (id: string) => void;
}

function EveningIcon() {
  return (
    <svg className="evening-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" fill="currentColor" />
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
  selectedPatternId,
  onSelectedPatternIdChange,
  eveningFilters,
  onEveningFiltersChange,
  passengerCount,
  onPassengerCountChange,
  weekends,
  selectedWeekendIds,
  onWeekendToggle
}: WeekendPickerProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedPattern = patterns.find(p => p.id === selectedPatternId);

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth'
    });
  };

  const handlePatternClick = (patternId: WeekendPatternId) => {
    onSelectedPatternIdChange(selectedPatternId === patternId ? null : patternId);
  };

  return (
    <div className="weekend-picker">
      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('search.travelWeekend')}</span>
          <span className="weekend-section-hint">{t('search.travelWeekendHint')}</span>
        </div>

        <div className="weekend-dates-row">
          <div className="weekend-track" ref={scrollRef} role="group" aria-label={t('search.selectWeekends')}>
            {weekends.map(weekend => {
              const active = selectedWeekendIds.includes(weekend.id);
              return (
                <button
                  key={weekend.id}
                  type="button"
                  className={`weekend-pill${active ? ' weekend-pill-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onWeekendToggle(weekend.id)}
                >
                  <span className="weekend-range">{weekend.shortLabel}</span>
                  <span className={`weekend-sub${selectedPattern ? '' : ' weekend-sub-placeholder'}`}>
                    {selectedPattern ? selectedPattern.shortLabel : '\u00A0'}
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

      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('search.tripType')}</span>
          <span className="weekend-section-hint">{t('search.tripTypeHint')}</span>
        </div>

        <div className="pattern-track" role="tablist" aria-label={t('search.selectTripType')}>
          {patterns.map(pattern => {
            const active = pattern.id === selectedPatternId;
            return (
              <button
                key={pattern.id}
                type="button"
                className={`pattern-pill${active ? ' pattern-pill-active' : ''}`}
                role="tab"
                aria-selected={active}
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
