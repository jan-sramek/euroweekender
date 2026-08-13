import { useTranslation } from 'react-i18next';
import type { RouteFacts } from '../utils/routeFacts';

interface RouteSeoFactsProps {
  fromLabel: string;
  toLabel: string;
  facts: RouteFacts;
  cheapestMonth?: string | null;
}

/** Unique, crawlable facts for an origin–destination weekend landing. */
export function RouteSeoFacts({ fromLabel, toLabel, facts, cheapestMonth }: RouteSeoFactsProps) {
  const { t } = useTranslation();
  const vars = { from: fromLabel, to: toLabel, duration: facts.durationLabel, distanceKm: facts.distanceKm };

  return (
    <div className="route-seo-facts">
      <h3 className="home-hub-links-title">{t('weekendFlightsOd.factsTitle', vars)}</h3>
      <ul className="route-seo-facts-list">
        <li>{t('weekendFlightsOd.durationHint', vars)}</li>
        <li>{t('weekendFlightsOd.weekendPatternHint', vars)}</li>
        {cheapestMonth ? (
          <li>{t('weekendFlightsOd.cheapestMonthHint', { ...vars, month: cheapestMonth })}</li>
        ) : null}
      </ul>
    </div>
  );
}
