import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PassengerPicker } from './PassengerPicker';
import { DayTripCalendarPopover } from './DayTripCalendarPopover';
import {
  DAY_TRIP_RANGE_PRESETS,
  getDayTripIdsForMonths,
  type DayTripOption
} from '../services/dayTrip';
import './WeekendPicker.css';

interface DayTripPickerProps {
  days: DayTripOption[];
  selectedDayIds: string[];
  /** Explicit range preset (1/3/6). Survives remaps that change day ids. */
  selectedRangeMonths?: number | null;
  onSelectedDayIdsChange: (ids: string[]) => void;
  onClearDays?: () => void;
  onSelectMonths?: (months: number) => void;
  passengerCount: number;
  onPassengerCountChange: (count: number) => void;
  longDay?: boolean;
  onLongDayChange?: (longDay: boolean) => void;
}

export function DayTripPicker({
  days,
  selectedDayIds,
  selectedRangeMonths,
  onSelectedDayIdsChange,
  onClearDays,
  onSelectMonths,
  passengerCount,
  onPassengerCountChange,
  longDay = false,
  onLongDayChange
}: DayTripPickerProps) {
  const { t } = useTranslation();

  const inferredRangeMonths = useMemo(() => {
    if (selectedDayIds.length === 0) return null;
    const selected = new Set(selectedDayIds);
    for (const months of DAY_TRIP_RANGE_PRESETS) {
      const ids = getDayTripIdsForMonths(days, months);
      if (ids.length === 0 || ids.length !== selected.size) continue;
      if (ids.every(id => selected.has(id))) return months;
    }
    return null;
  }, [days, selectedDayIds]);

  const activeRangeMonths =
    selectedRangeMonths !== undefined ? selectedRangeMonths : inferredRangeMonths;

  const rangeLabel = (months: number) => {
    if (months === 1) return t('search.weekendNextMonth');
    if (months === 3) return t('search.weekendNext3Months');
    return t('search.weekendNext6Months');
  };

  const calendarSummary = useMemo(() => {
    if (selectedDayIds.length === 0) return t('singleDayTrips.selectDays');
    if (activeRangeMonths != null) return rangeLabel(activeRangeMonths);
    if (selectedDayIds.length > 3) {
      return t('singleDayTrips.daysCount', { count: selectedDayIds.length });
    }
    return days
      .filter(day => selectedDayIds.includes(day.id))
      .map(day => day.shortLabel)
      .join(', ');
  }, [selectedDayIds, activeRangeMonths, days, t]);

  return (
    <div className="weekend-picker">
      <div className="weekend-section">
        <div className="weekend-section-header">
          <span className="weekend-section-label">{t('singleDayTrips.travelDay')}</span>
          <div className="weekend-section-actions">
            {selectedDayIds.length > 0 && onClearDays ? (
              <button type="button" className="weekend-clear-btn" onClick={onClearDays}>
                {t('search.clearWeekends')}
              </button>
            ) : null}
            <span className="weekend-section-hint">{t('singleDayTrips.travelDayHint')}</span>
          </div>
        </div>

        {onSelectMonths ? (
          <div className="weekend-range-presets" role="group" aria-label={t('singleDayTrips.selectDays')}>
            {DAY_TRIP_RANGE_PRESETS.map(months => {
              const active = activeRangeMonths === months;
              return (
                <button
                  key={months}
                  type="button"
                  className={`weekend-range-btn${active ? ' weekend-range-btn-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => onSelectMonths(months)}
                >
                  {rangeLabel(months)}
                </button>
              );
            })}
          </div>
        ) : null}

        <DayTripCalendarPopover
          days={days}
          selectedDayIds={selectedDayIds}
          summaryLabel={calendarSummary}
          onSelectedDayIdsChange={onSelectedDayIdsChange}
        />

        {onLongDayChange ? (
          <label className="day-trip-long-day">
            <input
              type="checkbox"
              checked={longDay}
              onChange={event => onLongDayChange(event.target.checked)}
            />
            <span className="day-trip-long-day-copy">
              <span className="day-trip-long-day-label">{t('singleDayTrips.longDay')}</span>
              <span className="day-trip-long-day-hint">{t('singleDayTrips.longDayHint')}</span>
            </span>
          </label>
        ) : null}
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
