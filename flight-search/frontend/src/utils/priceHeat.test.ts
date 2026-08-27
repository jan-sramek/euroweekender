import { describe, expect, it } from 'vitest';
import { PRICE_HEAT_STOPS, priceHeatColor } from './priceHeat';

function hueOf(color: string): number {
  const match = color.match(/^hsl\(([-\d.]+),/);
  if (!match) throw new Error(`expected hsl color, got ${color}`);
  return Number(match[1]);
}

describe('priceHeatColor', () => {
  it('uses the constant stops instead of a relative min/max', () => {
    expect(hueOf(priceHeatColor(PRICE_HEAT_STOPS[0].price))).toBe(142);
    expect(hueOf(priceHeatColor(70))).toBe(48);
    expect(hueOf(priceHeatColor(100))).toBe(22);
    expect(hueOf(priceHeatColor(130))).toBe(4);
    expect(hueOf(priceHeatColor(300))).toBe(4);
  });

  it('clamps below €20 to the cheapest green and above €300 to the deepest red', () => {
    expect(priceHeatColor(5)).toBe(priceHeatColor(20));
    expect(priceHeatColor(400)).toBe(priceHeatColor(300));
  });

  it('is already very expensive red at €130, then only darkens toward €300', () => {
    expect(hueOf(priceHeatColor(200))).toBe(4);
    expect(priceHeatColor(130)).not.toBe(priceHeatColor(300));
  });

  it('moves toward yellow between €20 and €70', () => {
    const mid = hueOf(priceHeatColor(45));
    expect(mid).toBeGreaterThan(48);
    expect(mid).toBeLessThan(142);
  });
});
