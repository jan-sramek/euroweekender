import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  toDayTripId,
  mondayFirstIndex,
  type DayTripOption
} from '../services/dayTrip';
import './DayTripCalendar.css';

interface DayTripCalendarProps {
  year: number;
  month: number;
  days: DayTripOption[];
  selectedDayIds: string[];
  onMonthChange: (year: number, month: number) => void;
  onSelectedDayIdsChange: (ids: string[]) => void;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  dayId: string | null;
  selectable: boolean;
  isSelected: boolean;
  isToday: boolean;
}

interface DragState {
  mode: 'add' | 'remove';
  lastId: string;
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

function sortDayIds(ids: string[], days: DayTripOption[]): string[] {
  const order = new Map(days.map((day, index) => [day.id, index]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function idsBetween(days: DayTripOption[], fromId: string, toId: string): string[] {
  const fromIndex = days.findIndex(day => day.id === fromId);
  const toIndex = days.findIndex(day => day.id === toId);
  if (fromIndex < 0 || toIndex < 0) return [];
  const [lo, hi] = fromIndex <= toIndex ? [fromIndex, toIndex] : [toIndex, fromIndex];
  return days.slice(lo, hi + 1).map(day => day.id);
}

/** Paint every day from `fromId` to `toId` (inclusive) onto the current selection. */
function paintPull(
  days: DayTripOption[],
  currentIds: string[],
  fromId: string,
  toId: string,
  mode: 'add' | 'remove'
): string[] {
  const next = new Set(currentIds);
  for (const id of idsBetween(days, fromId, toId)) {
    if (mode === 'add') next.add(id);
    else next.delete(id);
  }
  return sortDayIds([...next], days);
}

function dayIdFromPoint(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!(el instanceof Element)) return null;
  const dayEl = el.closest('[data-day-id]');
  if (!(dayEl instanceof HTMLElement)) return null;
  return dayEl.dataset.dayId ?? null;
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
  const leading = mondayFirstIndex(firstOfMonth);
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
  onDayPointerDown: (dayId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
}

function MonthGrid({ year, month, cells, weekdayLabels, onDayPointerDown }: MonthGridProps) {
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
                data-day-id={cell.dayId}
                className={`dtc-day dtc-day-selectable${cell.inMonth ? '' : ' dtc-day-outside'}${
                  cell.isSelected ? ' dtc-day-selected' : ''
                }${cell.isToday ? ' dtc-day-today' : ''}`}
                aria-pressed={cell.isSelected}
                aria-label={label}
                title={t('singleDayTrips.dayToggleHint')}
                onPointerDown={event => onDayPointerDown(cell.dayId!, event)}
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
  onSelectedDayIdsChange
}: DayTripCalendarProps) {
  const { t, i18n } = useTranslation();
  const today = startOfDay(new Date());
  const second = nextMonth(year, month);
  const dragRef = useRef<DragState | null>(null);
  const draftIdsRef = useRef<string[] | null>(null);
  const daysRef = useRef(days);
  const selectedRef = useRef(selectedDayIds);
  const onChangeRef = useRef(onSelectedDayIdsChange);
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState(false);

  daysRef.current = days;
  selectedRef.current = selectedDayIds;
  onChangeRef.current = onSelectedDayIdsChange;
  draftIdsRef.current = draftIds;

  const selectableIds = useMemo(() => new Set(days.map(day => day.id)), [days]);
  const displayIds = draftIds ?? selectedDayIds;
  const selectedIds = useMemo(() => new Set(displayIds), [displayIds]);

  const firstCells = useMemo(
    () => buildMonthGrid(year, month, selectableIds, selectedIds, today),
    [year, month, selectableIds, selectedIds, today]
  );

  const secondCells = useMemo(
    () => buildMonthGrid(second.year, second.month, selectableIds, selectedIds, today),
    [second.year, second.month, selectableIds, selectedIds, today]
  );

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
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

  const updateDragTo = (dayId: string) => {
    const drag = dragRef.current;
    if (!drag || dayId === drag.lastId) return;

    const painted = paintPull(
      daysRef.current,
      draftIdsRef.current ?? selectedRef.current,
      drag.lastId,
      dayId,
      drag.mode
    );
    drag.lastId = dayId;
    draftIdsRef.current = painted;
    setDraftIds(painted);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      const dayId = dayIdFromPoint(event.clientX, event.clientY);
      if (dayId) updateDragTo(dayId);
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (!drag) return;

      if (draftIdsRef.current) {
        onChangeRef.current(draftIdsRef.current);
      }

      dragRef.current = null;
      draftIdsRef.current = null;
      setDraftIds(null);
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const handleDayPointerDown = (dayId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const base = selectedRef.current;
    const mode: 'add' | 'remove' = new Set(base).has(dayId) ? 'remove' : 'add';
    const painted = paintPull(daysRef.current, base, dayId, dayId, mode);

    dragRef.current = {
      mode,
      lastId: dayId
    };
    draftIdsRef.current = painted;
    setDraftIds(painted);
    setDragging(true);
  };

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
    <div className={`day-trip-calendar${dragging ? ' day-trip-calendar-dragging' : ''}`}>
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
          onDayPointerDown={handleDayPointerDown}
        />
        <MonthGrid
          year={second.year}
          month={second.month}
          cells={secondCells}
          weekdayLabels={weekdayLabels}
          onDayPointerDown={handleDayPointerDown}
        />
      </div>
    </div>
  );
}
