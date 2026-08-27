/** Absolute weekend-fare heat scale in EUR (not relative to the current search). */
export const PRICE_HEAT_STOPS = [
  { price: 20, hue: 142, lightness: 42 },
  { price: 70, hue: 48, lightness: 45 },
  { price: 100, hue: 22, lightness: 46 },
  { price: 130, hue: 4, lightness: 48 },
  { price: 300, hue: 4, lightness: 36 }
] as const;

const SATURATION = 58;

function hsl(hue: number, lightness: number): string {
  return `hsl(${hue.toFixed(1)}, ${SATURATION}%, ${lightness.toFixed(1)}%)`;
}

/** Green at €20 → yellow at €70 → orange at €100 → red from €130, darker toward €300. */
export function priceHeatColor(price: number): string {
  const first = PRICE_HEAT_STOPS[0];
  const last = PRICE_HEAT_STOPS[PRICE_HEAT_STOPS.length - 1];
  if (price <= first.price) return hsl(first.hue, first.lightness);
  if (price >= last.price) return hsl(last.hue, last.lightness);

  for (let i = 1; i < PRICE_HEAT_STOPS.length; i++) {
    const right = PRICE_HEAT_STOPS[i];
    const left = PRICE_HEAT_STOPS[i - 1];
    if (price > right.price) continue;
    const t = (price - left.price) / (right.price - left.price);
    return hsl(
      left.hue + (right.hue - left.hue) * t,
      left.lightness + (right.lightness - left.lightness) * t
    );
  }

  return hsl(last.hue, last.lightness);
}
