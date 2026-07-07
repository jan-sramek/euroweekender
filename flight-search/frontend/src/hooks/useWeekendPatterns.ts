import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WEEKEND_PATTERNS } from '../services/weekend';
import type { WeekendPattern } from '../types/weekend';

export function useWeekendPatterns(): WeekendPattern[] {
  const { t } = useTranslation();

  return useMemo(
    () =>
      WEEKEND_PATTERNS.map(pattern => ({
        ...pattern,
        label: t(`patterns.${pattern.id}.label`),
        shortLabel: t(`patterns.${pattern.id}.short`)
      })),
    [t]
  );
}
