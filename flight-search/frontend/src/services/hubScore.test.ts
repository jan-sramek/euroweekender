import { describe, expect, it } from 'vitest';
import { computeEffectiveScore, normalizeHubScore } from '../services/hubScore';

describe('hubScore', () => {
  it('normalizes API payloads with camelCase or PascalCase keys', () => {
    const score = normalizeHubScore({
      Code: 'PRG',
      OfferCount: 42,
      MinPrice: 89,
      AverageQuality: 75,
      DestinationCount: 12,
      HubScore: 8.5
    });

    expect(score).toEqual({
      code: 'PRG',
      offerCount: 42,
      minPrice: 89,
      averageQuality: 75,
      destinationCount: 12,
      hubScore: 8.5
    });
  });

  it('reduces effective score as distance increases', () => {
    const near = computeEffectiveScore(10, 50);
    const far = computeEffectiveScore(10, 500);

    expect(near).toBeGreaterThan(far);
  });
});
