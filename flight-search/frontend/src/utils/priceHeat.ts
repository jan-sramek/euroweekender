/** Absolute weekend-fare heat scale in EUR (not relative to the current search). */
export const PRICE_HEAT_STOPS = [
  { price: 20, hue: 142, lightness: 42 },
  { price: 70, hue: 48, lightness: 45 },
  { price: 100, hue: 22, lightness: 46 },
  { price: 130, hue: 4, lightness: 48 },
  { price: 300, hue: 4, lightness: 36 }
] as const;

const BORDER_SATURATION = 58;
const FILL_SATURATION = 42;
/** Lift each stop toward white for calendar cell backgrounds. */
const FILL_LIGHTNESS_BOOST = 46;

function hsl(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness.toFixed(1)}%)`;
}

function interpolateHeat(price: number): { hue: number; lightness: number } {
  const first = PRICE_HEAT_STOPS[0];
  const last = PRICE_HEAT_STOPS[PRICE_HEAT_STOPS.length - 1];
  if (price <= first.price) return { hue: first.hue, lightness: first.lightness };
  if (price >= last.price) return { hue: last.hue, lightness: last.lightness };

  for (let i = 1; i < PRICE_HEAT_STOPS.length; i++) {
    const right = PRICE_HEAT_STOPS[i];
    const left = PRICE_HEAT_STOPS[i - 1];
    if (price > right.price) continue;
    const t = (price - left.price) / (right.price - left.price);
    return {
      hue: left.hue + (right.hue - left.hue) * t,
      lightness: left.lightness + (right.lightness - left.lightness) * t
    };
  }

  return { hue: last.hue, lightness: last.lightness };
}

/** Vivid heat color for borders / legend (green cheap → red expensive). */
export function priceHeatColor(price: number): string {
  const { hue, lightness } = interpolateHeat(price);
  return hsl(hue, BORDER_SATURATION, lightness);
}

/** Soft tint for calendar cell fills — same hue scale, much lighter. */
export function priceHeatFillColor(price: number): string {
  const { hue, lightness } = interpolateHeat(price);
  return hsl(hue, FILL_SATURATION, Math.min(94, lightness + FILL_LIGHTNESS_BOOST));
}
