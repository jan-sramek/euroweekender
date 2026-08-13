import { useEffect, useMemo, useState } from 'react';
import { SEO_HUB_CITIES } from '../data/seoHubCities';
import { SEO_POPULAR_ROUTES } from '../data/seoPopularRoutes';
import {
  pickEmptyStateDeals,
  type FeaturedDeal,
  type SeoDealSnapshot
} from '../data/emptyStateDeals';
import type { City } from '../types/city';
import { getCityDisplayName } from '../utils/cityDisplayName';

let snapshotPromise: Promise<SeoDealSnapshot | null> | null = null;

function loadDealSnapshot(): Promise<SeoDealSnapshot | null> {
  if (!snapshotPromise) {
    snapshotPromise = fetch('/seo-deal-snapshot.json')
      .then(response => (response.ok ? response.json() : null))
      .catch(() => null);
  }
  return snapshotPromise;
}

export function useEmptyStateDeals(
  originCodes: string[],
  allCities: City[],
  language: string,
  enabled: boolean
): FeaturedDeal[] {
  const [snapshot, setSnapshot] = useState<SeoDealSnapshot | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void loadDealSnapshot().then(data => {
      if (!cancelled && data) setSnapshot(data);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const nameByCode = useMemo(() => {
    const names = new Map<string, string>();
    for (const hub of SEO_HUB_CITIES) {
      names.set(hub.code.toUpperCase(), hub.name);
    }
    for (const city of allCities) {
      names.set(city.code.toUpperCase(), getCityDisplayName(city, language));
    }
    return names;
  }, [allCities, language]);

  const originKey = originCodes.map(code => code.trim().toUpperCase()).filter(Boolean).join(',');

  return useMemo(
    () =>
      pickEmptyStateDeals(snapshot, originKey ? originKey.split(',') : [], {
        limit: 5,
        popularRoutes: SEO_POPULAR_ROUTES,
        nameByCode
      }),
    [snapshot, originKey, nameByCode]
  );
}
