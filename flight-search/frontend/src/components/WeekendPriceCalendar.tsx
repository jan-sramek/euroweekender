import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getWeekendTripDays } from '../services/weekend';
import { formatEur } from '../utils/flightPrice';
import type { WeekendOption } from '../types/weekend';
import './WeekendPriceCalendar.css';

interface WeekendPriceCalendarProps {
  year: number;
  month: number;
  weekends: WeekendOption[];
  pricesByWeekendId: Map<string, number | null>;
  selectedWeekendId: string | null;
  onMonthChange: (year: number, month: number) => void;
  onWeekendSelect: (weekendId: string) => void;
  loading?: boolean;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  weekendId: string | null;
  price: number | null;
  isSelected: boolean;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Monday-first index: Mon=0 … Sun=6 */
function mondayFirstIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function priceHeatColor(price: number, min: number, max: number): string {
  if (max <= min) {
    return 'hsl(142, 55%, 42%)';
  }

  const t = Math.min(1, Math.max(0, (price - min) / (max - min)));
  // green (142) → yellow (48) → red (4)
  const hue = t < 0.5 ? 142 - (142 - 48) * (t * 2) : 48 - (48 - 4) * ((t - 0.5) * 2);
  const lightness = 42 + t * 6;
  return `hsl(${hue.toFixed(1)}, 58%, ${lightness.toFixed(1)}%)`;
}

function buildMonthGrid(
  year: number,
  month: number,
  weekends: WeekendOption[],
  pricesByWeekendId: Map<string, number | null>,
  selectedWeekendId: string | null
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = mondayFirstIndex(firstOfMonth);
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

  const dayToWeekend = new Map<string, { weekendId: string; price: number | null }>();
  for (const weekend of weekends) {
    const price = pricesByWeekendId.get(weekend.id) ?? null;
    for (const day of getWeekendTripDays(weekend)) {
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      const existing = dayToWeekend.get(key);
      if (!existing || (price != null && (existing.price == null || price < existing.price))) {
        dayToWeekend.set(key, { weekendId: weekend.id, price });
      }
    }
  }

  const cells: CalendarDay[] = [];
  const gridStart = startOfDay(new Date(year, month, 1 - leading));

  for (let i = 0; i < totalCells; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const hit = dayToWeekend.get(key);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      weekendId: hit?.weekendId ?? null,
      price: hit?.price ?? null,
      isSelected: hit != null && hit.weekendId === selectedWeekendId
    });
  }

  return cells;
}

export function WeekendPriceCalendar({
  year,
  month,
  weekends,
  pricesByWeekendId,
  selectedWeekendId,
  onMonthChange,
  onWeekendSelect,
  loading = false
}: WeekendPriceCalendarProps) {
  const { t, i18n } = useTranslation();

  const pricedValues = useMemo(() => {
    const values: number[] = [];
    for (const weekend of weekends) {
      const price = pricesByWeekendId.get(weekend.id);
      if (price != null) values.push(price);
    }
    return values;
  }, [weekends, pricesByWeekendId]);

  const minPrice = pricedValues.length > 0 ? Math.min(...pricedValues) : 0;
  const maxPrice = pricedValues.length > 0 ? Math.max(...pricedValues) : 0;

  const cells = useMemo(
    () => buildMonthGrid(year, month, weekends, pricesByWeekendId, selectedWeekendId),
    [year, month, weekends, pricesByWeekendId, selectedWeekendId]
  );

  const monthLabel = useMemo(
    () =>
      new Date(year, month, 1).toLocaleDateString(i18n.language, {
        month: 'long',
        year: 'numeric'
      }),
    [year, month, i18n.language]
  );

  const weekdayLabels = useMemo(() => {
    const monday = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
      return day.toLocaleDateString(i18n.language, { weekday: 'short' });
    });
  }, [i18n.language]);

  const goPrev = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };

  const goNext = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  const today = startOfDay(new Date());

  return (
    <div className={`weekend-price-calendar${loading ? ' weekend-price-calendar-loading' : ''}`}>
      <div className="wpc-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={goPrev} aria-label={t('cheapestWeekend.prevMonth')}>
          ‹
        </button>
        <h2 className="wpc-month-label">{monthLabel}</h2>
        <button type="button" className="btn btn-secondary btn-sm" onClick={goNext} aria-label={t('cheapestWeekend.nextMonth')}>
          ›
        </button>
      </div>

      <div className="wpc-legend" aria-hidden="true">
        <span className="wpc-legend-cheap">{t('cheapestWeekend.legendCheap')}</span>
        <span className="wpc-legend-bar" />
        <span className="wpc-legend-expensive">{t('cheapestWeekend.legendExpensive')}</span>
      </div>

      <div className="wpc-grid" role="grid" aria-label={t('cheapestWeekend.calendarLabel')}>
        {weekdayLabels.map(label => (
          <div key={label} className="wpc-weekday" role="columnheader">
            {label}
          </div>
        ))}

        {cells.map(cell => {
          const key = cell.date.toISOString();
          const hasDeal = cell.weekendId != null && cell.price != null;
          const style =
            hasDeal && cell.price != null
              ? { backgroundColor: priceHeatColor(cell.price, minPrice, maxPrice) }
              : undefined;

          if (cell.weekendId && hasDeal) {
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={`wpc-day wpc-day-priced${cell.inMonth ? '' : ' wpc-day-outside'}${
                  cell.isSelected ? ' wpc-day-selected' : ''
                }${sameDay(cell.date, today) ? ' wpc-day-today' : ''}`}
                style={style}
                onClick={() => onWeekendSelect(cell.weekendId!)}
                aria-pressed={cell.isSelected}
                aria-label={t('cheapestWeekend.dayWithPrice', {
                  date: cell.date.toLocaleDateString(i18n.language, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  }),
                  price: formatEur(cell.price!)
                })}
              >
                <span className="wpc-day-number">{cell.date.getDate()}</span>
                <span className="wpc-day-price">{Math.round(cell.price!)}</span>
              </button>
            );
          }

          return (
            <div
              key={key}
              role="gridcell"
              className={`wpc-day${cell.inMonth ? '' : ' wpc-day-outside'}${
                cell.weekendId ? ' wpc-day-weekend-empty' : ''
              }${sameDay(cell.date, today) ? ' wpc-day-today' : ''}`}
              aria-label={cell.date.toLocaleDateString(i18n.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            >
              <span className="wpc-day-number">{cell.date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
