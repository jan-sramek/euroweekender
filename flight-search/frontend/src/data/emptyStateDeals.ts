export interface DealCity {
  code: string;
  name: string;
}

export interface FeaturedDeal {
  from: DealCity;
  to: DealCity;
  minPrice: number | null;
}

export interface SeoDealDestination {
  code: string;
  name: string;
  minPrice: number;
  offerCount?: number;
  cheapOfferCount?: number;
}

export interface SeoDealSnapshot {
  fetchedAt?: string | null;
  destinationsByOrigin?: Record<string, SeoDealDestination[]>;
}

function norm(code: string): string {
  return code.trim().toUpperCase();
}

function pairKey(from: string, to: string): string {
  return `${norm(from)}-${norm(to)}`;
}

function lookupPrice(
  destsByOrigin: Record<string, SeoDealDestination[]>,
  fromCode: string,
  toCode: string
): number | null {
  const match = (destsByOrigin[norm(fromCode)] ?? []).find(dest => norm(dest.code) === norm(toCode));
  return match && match.minPrice > 0 ? match.minPrice : null;
}

export function pickEmptyStateDeals(
  snapshot: SeoDealSnapshot | null | undefined,
  originCodes: string[],
  options: {
    limit?: number;
    popularRoutes?: Array<{ from: DealCity; to: DealCity }>;
    nameByCode?: Map<string, string>;
  } = {}
): FeaturedDeal[] {
  const limit = options.limit ?? 5;
  const destsByOrigin = snapshot?.destinationsByOrigin ?? {};
  const nameByCode = options.nameByCode ?? new Map<string, string>();
  const popularRoutes = options.popularRoutes ?? [];

  function city(code: string, fallbackName?: string): DealCity {
    const upper = norm(code);
    return { code: upper, name: nameByCode.get(upper) || fallbackName || upper };
  }

  const picked: FeaturedDeal[] = [];
  const seen = new Set<string>();

  function tryAdd(
    fromCode: string,
    toCode: string,
    fromName?: string,
    toName?: string,
    minPrice?: number | null
  ) {
    if (picked.length >= limit) return;
    const from = norm(fromCode);
    const to = norm(toCode);
    if (!from || !to || from === to) return;
    const key = pairKey(from, to);
    if (seen.has(key)) return;
    seen.add(key);
    const destRow = (destsByOrigin[from] ?? []).find(dest => norm(dest.code) === to);
    const price = minPrice ?? lookupPrice(destsByOrigin, from, to);
    picked.push({
      from: city(from, fromName),
      to: city(to, destRow?.name ?? toName),
      minPrice: price != null && price > 0 ? price : null
    });
  }

  for (const origin of originCodes) {
    const from = norm(origin);
    const dests = [...(destsByOrigin[from] ?? [])]
      .filter(dest => dest.minPrice > 0 && norm(dest.code) !== from)
      .sort((a, b) => a.minPrice - b.minPrice);
    for (const dest of dests) {
      tryAdd(from, dest.code, undefined, dest.name, dest.minPrice);
    }
  }

  for (const route of popularRoutes) {
    const price = lookupPrice(destsByOrigin, route.from.code, route.to.code);
    if (price == null) continue;
    tryAdd(route.from.code, route.to.code, route.from.name, route.to.name, price);
  }

  const allPairs: Array<{ from: string; to: SeoDealDestination }> = [];
  for (const [from, dests] of Object.entries(destsByOrigin)) {
    for (const dest of dests) {
      if (dest.minPrice > 0 && norm(dest.code) !== from) {
        allPairs.push({ from, to: dest });
      }
    }
  }
  allPairs.sort((a, b) => a.to.minPrice - b.to.minPrice);
  for (const pair of allPairs) {
    tryAdd(pair.from, pair.to.code, undefined, pair.to.name, pair.to.minPrice);
  }

  for (const route of popularRoutes) {
    tryAdd(route.from.code, route.to.code, route.from.name, route.to.name, null);
  }

  return picked;
}
