export type WeekendPatternId = 'fri-sun' | 'thu-sun' | 'fri-mon' | 'wed-sun' | 'fri-tue';

/** Outbound may spill into the next calendar day (e.g. Fri 00:00–Sat 03:00 for Fri–Sun). */
export const OUTBOUND_SPILL_HOURS = 3;

export interface WeekendPattern {
  id: WeekendPatternId;
  label: string;
  shortLabel: string;
  departWeekday: number;
  returnWeekday: number;
  eveningHour: number;
  outboundSpillHours: number;
  nightsInDest: number;
}

export interface WeekendOption {
  id: string;
  patternId: WeekendPatternId | null;
  label: string;
  shortLabel: string;
  departDate: Date;
  departFrom: Date;
  departTo: Date;
  returnDate: Date;
  returnFrom: Date;
  returnTo: Date;
  departWeekday: number;
  returnWeekday: number;
  eveningHour: number;
  outboundSpillHours: number;
  nightsInDest: number;
}
