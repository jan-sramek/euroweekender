import { LOCALES } from './seo-locales.mjs';

const COUNTRY_LOCAL_LOCALES = {
  AT: ['de'],
  BE: ['fr', 'nl'],
  BG: ['bg'],
  CH: ['de', 'fr', 'it'],
  CZ: ['cs'],
  DE: ['de'],
  DK: ['da'],
  EE: ['et'],
  ES: ['es'],
  FI: ['fi'],
  FR: ['fr'],
  GB: [],
  GR: ['el'],
  HU: ['hu'],
  IE: [],
  IS: ['is'],
  IT: ['it'],
  LT: ['lt'],
  LU: ['fr', 'de'],
  LV: ['lv'],
  MD: ['ro'],
  NL: ['nl'],
  NO: ['no'],
  PL: ['pl'],
  PT: ['pt'],
  RO: ['ro'],
  SE: ['sv'],
  SK: ['sk'],
  TR: ['tr'],
  UA: ['uk']
};

const CITY_LOCAL_LOCALE_OVERRIDES = {
  BSL: ['de', 'fr'],
  CRL: ['fr'],
  GVA: ['fr'],
  ZRH: ['de']
};

function uniqueLocales(codes) {
  const seen = new Set();
  const ordered = [];
  for (const code of codes) {
    if (!LOCALES.includes(code) || seen.has(code)) continue;
    seen.add(code);
    ordered.push(code);
  }
  return ordered;
}

/** English plus languages spoken in this hub city. */
export function indexableLocalesForHub(hub) {
  const code = String(hub?.code ?? '')
    .trim()
    .toUpperCase();
  const override = CITY_LOCAL_LOCALE_OVERRIDES[code];
  const country = String(hub?.country ?? '')
    .trim()
    .toUpperCase();
  const local = override ?? COUNTRY_LOCAL_LOCALES[country] ?? [];
  return uniqueLocales(['en', ...local]);
}
