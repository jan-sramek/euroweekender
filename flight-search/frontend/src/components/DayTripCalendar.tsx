import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  toDayTripId,
  wednesdayFirstIndex,
  type DayTripOption
} from '../services/dayTrip';
import './DayTripCalendar.css';

interface DayTripCalendarProps {
  year: number;
  month: number;
  days: DayTripOption[];
  selectedDayIds: string[];
  onMonthChange: (year: number, month: number) => void;
  onDayToggle: (dayId: string) => void;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  dayId: string | null;
  selectable: boolean;
  isSelected: boolean;
  isToday: boolean;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

function buildMonthGrid(
  year: number,
  month: number,
  selectableIds: Set<string>,
  selectedIds: Set<string>,
  today: Date
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = wednesdayFirstIndex(firstOfMonth);
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;
  const gridStart = startOfDay(new Date(year, month, 1 - leading));

  const cells: CalendarDay[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const dayId = toDayTripId(date);
    const selectable = selectableIds.has(dayId);

    cells.push({
      date,
      inMonth: date.getMonth() === month,
      dayId: selectable ? dayId : null,
      selectable,
      isSelected: selectedIds.has(dayId),
      isToday: sameDay(date, today)
    });
  }

  return cells;
}

interface MonthGridProps {
  year: number;
  month: number;
  cells: CalendarDay[];
  weekdayLabels: string[];
  onDayToggle: (dayId: string) => void;
}

function MonthGrid({ year, month, cells, weekdayLabels, onDayToggle }: MonthGridProps) {
  const { t, i18n } = useTranslation();

  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString(i18n.language, {
        month: 'long',
        year: 'numeric'
      }),
    [year, month, i18n.language]
  );

  return (
    <div className="dtc-month">
      <h3 className="dtc-month-title">{monthLabel}</h3>
      <div className="dtc-grid" role="grid" aria-label={monthLabel}>
        {weekdayLabels.map(label => (
          <div key={`${year}-${month}-${label}`} className="dtc-weekday" role="columnheader">
            {label}
          </div>
        ))}

        {cells.map(cell => {
          const key = `${year}-${month}-${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
          const label = cell.date.toLocaleDateString(i18n.language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });

          if (cell.dayId && cell.selectable) {
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={`dtc-day dtc-day-selectable${cell.inMonth ? '' : ' dtc-day-outside'}${
                  cell.isSelected ? ' dtc-day-selected' : ''
                }${cell.isToday ? ' dtc-day-today' : ''}`}
                aria-pressed={cell.isSelected}
                aria-label={label}
                title={t('singleDayTrips.dayToggleHint')}
                onClick={() => onDayToggle(cell.dayId!)}
              >
                <span className="dtc-day-number">{cell.date.getDate()}</span>
              </button>
            );
          }

          return (
            <div
              key={key}
              role="gridcell"
              className={`dtc-day${cell.inMonth ? '' : ' dtc-day-outside'}${
                cell.isToday ? ' dtc-day-today' : ''
              }`}
              aria-label={label}
              aria-disabled="true"
            >
              <span className="dtc-day-number">{cell.date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayTripCalendar({
  year,
  month,
  days,
  selectedDayIds,
  onMonthChange,
  onDayToggle
}: DayTripCalendarProps) {
  const { t, i18n } = useTranslation();
  const second = nextMonth(year, month);
  const today = startOfDay(new Date());
  const selectableIds = useMemo(() => new Set(days.map(day => day.id)), [days]);
  const selectedIds = useMemo(() => new Set(selectedDayIds), [selectedDayIds]);

  const firstCells = useMemo(
    () => buildMonthGrid(year, month, selectableIds, selectedIds, today),
    [year, month, selectableIds, selectedIds, today]
  );

  const secondCells = useMemo(
    () => buildMonthGrid(second.year, second.month, selectableIds, selectedIds, today),
    [second.year, second.month, selectableIds, selectedIds, today]
  );

  const weekdayLabels = useMemo(() => {
    // 2024-01-03 is a Wednesday
    const wednesday = new Date(2024, 0, 3);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(wednesday);
      day.setDate(wednesday.getDate() + index);
      return day.toLocaleDateString(i18n.language, { weekday: 'short' });
    });
  }, [i18n.language]);

  const horizonEnd = useMemo(() => {
    if (days.length === 0) return today;
    return startOfDay(days[days.length - 1].date);
  }, [days, today]);

  const canGoPrev =
    year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

  const canGoNext =
    year < horizonEnd.getFullYear() ||
    (year === horizonEnd.getFullYear() && month < horizonEnd.getMonth());

  const goPrev = () => {
    if (!canGoPrev) return;
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div className="day-trip-calendar">
      <div className="dtc-header">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label={t('cheapestWeekend.prevMonth')}
        >
          ‹
        </button>
        <div className="dtc-header-copy">
          <h2 className="dtc-title">{t('singleDayTrips.calendarLabel')}</h2>
          <p className="dtc-hint">{t('singleDayTrips.calendarHint')}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label={t('cheapestWeekend.nextMonth')}
        >
          ›
        </button>
      </div>

      <div className="dtc-months">
        <MonthGrid
          year={year}
          month={month}
          cells={firstCells}
          weekdayLabels={weekdayLabels}
          onDayToggle={onDayToggle}
        />
        <MonthGrid
          year={second.year}
          month={second.month}
          cells={secondCells}
          weekdayLabels={weekdayLabels}
          onDayToggle={onDayToggle}
        />
      </div>
    </div>
  );
}
