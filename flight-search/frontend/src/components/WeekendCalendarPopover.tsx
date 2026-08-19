import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { mondayFirstIndex } from '../services/dayTrip';
import {
  buildDayToWeekendId,
  calendarDayKey,
  paintWeekendPull
} from '../services/weekendCalendar';
import type { WeekendOption } from '../types/weekend';
import './WeekendCalendarPopover.css';

interface WeekendCalendarPopoverProps {
  weekends: WeekendOption[];
  selectedWeekendIds: string[];
  summaryLabel: string;
  onSelectedWeekendIdsChange: (ids: string[]) => void;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  weekendId: string | null;
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

function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

function weekendIdFromPoint(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!(el instanceof Element)) return null;
  const dayEl = el.closest('[data-weekend-id]');
  if (!(dayEl instanceof HTMLElement)) return null;
  return dayEl.dataset.weekendId ?? null;
}

function buildMonthGrid(
  year: number,
  month: number,
  dayToWeekendId: Map<string, string>,
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
    const weekendId = dayToWeekendId.get(calendarDayKey(date)) ?? null;
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      weekendId,
      isSelected: weekendId != null && selectedIds.has(weekendId),
      isToday: sameDay(date, today)
    });
  }
  return cells;
}

function CalendarIcon() {
  return (
    <svg className="wcp-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function WeekendCalendarPopover({
  weekends,
  selectedWeekendIds,
  summaryLabel,
  onSelectedWeekendIdsChange
}: WeekendCalendarPopoverProps) {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => startOfDay(new Date()), []);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const draftIdsRef = useRef<string[] | null>(null);
  const weekendsRef = useRef(weekends);
  const selectedRef = useRef(selectedWeekendIds);
  const onChangeRef = useRef(onSelectedWeekendIdsChange);
  const draggingRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [draftIds, setDraftIds] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  weekendsRef.current = weekends;
  selectedRef.current = selectedWeekendIds;
  onChangeRef.current = onSelectedWeekendIdsChange;
  draftIdsRef.current = draftIds;
  draggingRef.current = dragging;

  const displayIds = draftIds ?? selectedWeekendIds;
  const selectedIds = useMemo(() => new Set(displayIds), [displayIds]);
  const dayToWeekendId = useMemo(() => buildDayToWeekendId(weekends), [weekends]);

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, dayToWeekendId, selectedIds, today),
    [viewYear, viewMonth, dayToWeekendId, selectedIds, today]
  );

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
      return day.toLocaleDateString(i18n.language, { weekday: 'short' });
    });
  }, [i18n.language]);

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString(i18n.language, {
        month: 'long',
        year: 'numeric'
      }),
    [viewYear, viewMonth, i18n.language]
  );

  const horizonStart = weekends[0] ? startOfDay(weekends[0].departDate) : today;
  const horizonEnd = weekends.length
    ? startOfDay(weekends[weekends.length - 1].returnDate)
    : today;

  const canGoPrev =
    viewYear > horizonStart.getFullYear() ||
    (viewYear === horizonStart.getFullYear() && viewMonth > horizonStart.getMonth());

  const canGoNext =
    viewYear < horizonEnd.getFullYear() ||
    (viewYear === horizonEnd.getFullYear() && viewMonth < horizonEnd.getMonth());

  const updatePopoverPosition = () => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const gap = 8;
    let top = rect.bottom + gap;
    let left = rect.left;
    const width = Math.min(Math.max(rect.width, 288), window.innerWidth - gap * 2);

    if (top + popRect.height > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - popRect.height - gap);
    }
    if (left + width > window.innerWidth - gap) {
      left = Math.max(gap, window.innerWidth - width - gap);
    }

    setPopoverPos({ top, left, width });
  };

  const openCalendar = () => {
    const first = weekends.find(weekend => selectedWeekendIds.includes(weekend.id));
    const date = first?.departDate ?? today;
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setOpen(true);
  };

  const closeCalendar = () => {
    if (draggingRef.current) return;
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) {
      setPopoverPos(null);
      return;
    }
    updatePopoverPosition();
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return;

    const onReposition = () => updatePopoverPosition();
    const onPointerDown = (event: PointerEvent) => {
      if (draggingRef.current) return;
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCalendar();
    };

    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const updateDragTo = (weekendId: string) => {
    const drag = dragRef.current;
    if (!drag || weekendId === drag.lastId) return;

    const painted = paintWeekendPull(
      weekendsRef.current,
      draftIdsRef.current ?? selectedRef.current,
      drag.lastId,
      weekendId,
      drag.mode
    );
    drag.lastId = weekendId;
    draftIdsRef.current = painted;
    setDraftIds(painted);
  };

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      const weekendId = weekendIdFromPoint(event.clientX, event.clientY);
      if (weekendId) updateDragTo(weekendId);
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

  const handleDayPointerDown = (weekendId: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();

    const base = selectedRef.current;
    const mode: 'add' | 'remove' = new Set(base).has(weekendId) ? 'remove' : 'add';
    const painted = paintWeekendPull(weekendsRef.current, base, weekendId, weekendId, mode);

    dragRef.current = { mode, lastId: weekendId };
    draftIdsRef.current = painted;
    setDraftIds(painted);
    setDragging(true);
  };

  const goPrev = () => {
    if (!canGoPrev) return;
    const next = prevMonth(viewYear, viewMonth);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  const goNext = () => {
    if (!canGoNext) return;
    const next = nextMonth(viewYear, viewMonth);
    setViewYear(next.year);
    setViewMonth(next.month);
  };

  return (
    <div className="wcp-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={`wcp-trigger${open ? ' wcp-trigger-open' : ''}${
          selectedWeekendIds.length > 0 ? ' wcp-trigger-active' : ''
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('search.openWeekendCalendar')}
        onClick={() => (open ? closeCalendar() : openCalendar())}
      >
        <CalendarIcon />
        <span className="wcp-trigger-label">{summaryLabel}</span>
        <span className="wcp-trigger-caret" aria-hidden="true">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className={`wcp-popover${dragging ? ' wcp-popover-dragging' : ''}`}
              role="dialog"
              aria-label={t('search.weekendCalendarLabel')}
              style={
                popoverPos
                  ? {
                      top: popoverPos.top,
                      left: popoverPos.left,
                      width: popoverPos.width
                    }
                  : { visibility: 'hidden' }
              }
            >
              <div className="wcp-header">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  aria-label={t('cheapestWeekend.prevMonth')}
                >
                  ‹
                </button>
                <div className="wcp-header-copy">
                  <h2 className="wcp-month-label">{monthLabel}</h2>
                  <p className="wcp-hint">{t('search.weekendCalendarHint')}</p>
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

              <div className="wcp-grid" role="grid" aria-label={monthLabel}>
                {weekdayLabels.map((label, index) => (
                  <div key={`${index}-${label}`} className="wcp-weekday" role="columnheader">
                    {label}
                  </div>
                ))}

                {cells.map(cell => {
                  const key = `${viewYear}-${viewMonth}-${calendarDayKey(cell.date)}`;
                  const label = cell.date.toLocaleDateString(i18n.language, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  });

                  if (cell.weekendId) {
                    return (
                      <button
                        key={key}
                        type="button"
                        role="gridcell"
                        data-weekend-id={cell.weekendId}
                        className={`wcp-day wcp-day-selectable${
                          cell.inMonth ? '' : ' wcp-day-outside'
                        }${cell.isSelected ? ' wcp-day-selected' : ''}${
                          cell.isToday ? ' wcp-day-today' : ''
                        }`}
                        aria-pressed={cell.isSelected}
                        aria-label={label}
                        onPointerDown={event => handleDayPointerDown(cell.weekendId!, event)}
                      >
                        <span className="wcp-day-number">{cell.date.getDate()}</span>
                      </button>
                    );
                  }

                  return (
                    <div
                      key={key}
                      role="gridcell"
                      className={`wcp-day${cell.inMonth ? '' : ' wcp-day-outside'}${
                        cell.isToday ? ' wcp-day-today' : ''
                      }`}
                      aria-label={label}
                      aria-disabled="true"
                    >
                      <span className="wcp-day-number">{cell.date.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
