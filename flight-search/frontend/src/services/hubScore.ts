import type { HubScore } from '../types/city';

export const HUB_DISTANCE_PENALTY_EXPONENT = 1.5;

/** Distance-adjusted ranking for nearby airports. Hub scores come from the API. */
export function computeEffectiveScore(hubScore: number, distanceKm: number): number {
  if (hubScore <= 0) return 0;
  const distanceFactor = (1 + distanceKm / 100) ** HUB_DISTANCE_PENALTY_EXPONENT;
  return hubScore / distanceFactor;
}

export function hubScoresByCode(scores: HubScore[]): Map<string, HubScore> {
  return new Map(scores.map(score => [score.code.toUpperCase(), score]));
}

export function normalizeHubScore(raw: Record<string, unknown>): HubScore {
  const hubScore = Number(raw.hubScore ?? raw.HubScore ?? 0);
  return {
    code: String(raw.code ?? raw.Code ?? ''),
    offerCount: Number(raw.offerCount ?? raw.OfferCount ?? 0),
    minPrice: Number(raw.minPrice ?? raw.MinPrice ?? 0),
    averageQuality: Number(raw.averageQuality ?? raw.AverageQuality ?? 0),
    destinationCount: Number(raw.destinationCount ?? raw.DestinationCount ?? 0),
    hubScore: Number.isFinite(hubScore) ? hubScore : 0
  };
}
