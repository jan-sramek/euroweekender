import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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
  pointerId: number;
  mode: 'add' | 'remove';
  anchorId: string;
  baseIds: string[];
  moved: boolean;
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

function applyDragSelection(
  days: DayTripOption[],
  baseIds: string[],
  anchorId: string,
  currentId: string,
  mode: 'add' | 'remove'
): string[] {
  const range = idsBetween(days, anchorId, currentId);
  const next = new Set(baseIds);
  for (const id of range) {
    if (mode === 'add') next.add(id);
    else next.delete(id);
  }
  return sortDayIds([...next], days);
}

function toggleDay(days: DayTripOption[], baseIds: string[], dayId: string): string[] {
  const next = new Set(baseIds);
  if (next.has(dayId)) next.delete(dayId);
  else next.add(dayId);
  return sortDayIds([...next], days);
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
  onDayPointerDown: (dayId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
  onDayPointerEnter: (dayId: string) => void;
}

function MonthGrid({
  year,
  month,
  cells,
  weekdayLabels,
  onDayPointerDown,
  onDayPointerEnter
}: MonthGridProps) {
  const { t, i18n } = useTranslation();

  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString(i18n.language, {
        month: 'short',
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
                onPointerEnter={() => onDayPointerEnter(cell.dayId!)}
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
  const dragRef = useRef<DragState | null>(null);
  const draftIdsRef = useRef<string[] | null>(null);
  const daysRef = useRef(days);
  const onChangeRef = useRef(onSelectedDayIdsChange);
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState(false);

  daysRef.current = days;
  onChangeRef.current = onSelectedDayIdsChange;
  draftIdsRef.current = draftIds;

  const selectableIds = useMemo(() => new Set(days.map(day => day.id)), [days]);
  const displayIds = draftIds ?? selectedDayIds;
  const selectedIds = useMemo(() => new Set(displayIds), [displayIds]);

  const cells = useMemo(
    () => buildMonthGrid(year, month, selectableIds, selectedIds, today),
    [year, month, selectableIds, selectedIds, today]
  );

  const weekdayLabels = useMemo(() => {
    const wednesday = new Date(2024, 0, 3);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(wednesday);
      day.setDate(wednesday.getDate() + index);
      return day.toLocaleDateString(i18n.language, { weekday: 'narrow' });
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

  useEffect(() => {
    const finish = () => {
      const drag = dragRef.current;
      if (!drag) return;

      if (!drag.moved) {
        onChangeRef.current(toggleDay(daysRef.current, drag.baseIds, drag.anchorId));
      } else if (draftIdsRef.current) {
        onChangeRef.current(draftIdsRef.current);
      }

      dragRef.current = null;
      draftIdsRef.current = null;
      setDraftIds(null);
      setDragging(false);
    };

    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, []);

  const handleDayPointerDown = (dayId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      mode: selectedIds.has(dayId) ? 'remove' : 'add',
      anchorId: dayId,
      baseIds: [...selectedDayIds],
      moved: false
    };
    setDraftIds(null);
    setDragging(true);
  };

  const handleDayPointerEnter = (dayId: string) => {
    const drag = dragRef.current;
    if (!drag) return;
    drag.moved = drag.moved || dayId !== drag.anchorId;
    const next = applyDragSelection(
      daysRef.current,
      drag.baseIds,
      drag.anchorId,
      dayId,
      drag.mode
    );
    draftIdsRef.current = next;
    setDraftIds(next);
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

      <MonthGrid
        year={year}
        month={month}
        cells={cells}
        weekdayLabels={weekdayLabels}
        onDayPointerDown={handleDayPointerDown}
        onDayPointerEnter={handleDayPointerEnter}
      />
    </div>
  );
}
