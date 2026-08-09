/** ISO 3166-1 alpha-2 codes for flagcdn.com (lowercase). */
const COUNTRY_FLAG_CODES: Record<string, string> = {
  Albania: 'al',
  Andorra: 'ad',
  Armenia: 'am',
  Austria: 'at',
  Azerbaijan: 'az',
  Belarus: 'by',
  Belgium: 'be',
  'Bosnia and Herzegovina': 'ba',
  Bulgaria: 'bg',
  Croatia: 'hr',
  Cyprus: 'cy',
  Czechia: 'cz',
  'Czech Republic': 'cz',
  Denmark: 'dk',
  Estonia: 'ee',
  Finland: 'fi',
  France: 'fr',
  Georgia: 'ge',
  Germany: 'de',
  Greece: 'gr',
  Hungary: 'hu',
  Iceland: 'is',
  Ireland: 'ie',
  Italy: 'it',
  Kazakhstan: 'kz',
  Kosovo: 'xk',
  Latvia: 'lv',
  Liechtenstein: 'li',
  Lithuania: 'lt',
  Luxembourg: 'lu',
  Malta: 'mt',
  Moldova: 'md',
  Monaco: 'mc',
  Montenegro: 'me',
  Netherlands: 'nl',
  'North Macedonia': 'mk',
  'Republic of North Macedonia': 'mk',
  'Republic of Macedonia': 'mk',
  'Macedonia (FYROM)': 'mk',
  'Former Yugoslav Republic of Macedonia': 'mk',
  'the former Yugoslav Republic of Macedonia': 'mk',
  Macedonia: 'mk',
  Norway: 'no',
  Poland: 'pl',
  Portugal: 'pt',
  Romania: 'ro',
  Russia: 'ru',
  'Russian Federation': 'ru',
  'San Marino': 'sm',
  Serbia: 'rs',
  Slovakia: 'sk',
  Slovenia: 'si',
  Spain: 'es',
  Sweden: 'se',
  Switzerland: 'ch',
  Turkey: 'tr',
  Türkiye: 'tr',
  Ukraine: 'ua',
  'United Kingdom': 'gb',
  'Great Britain': 'gb',
  England: 'gb',
  Scotland: 'gb',
  Wales: 'gb',
  'United States': 'us',
  'United States of America': 'us',
  Canada: 'ca',
  Morocco: 'ma',
  Tunisia: 'tn',
  Egypt: 'eg',
  Israel: 'il',
  'United Arab Emirates': 'ae'
};

const KNOWN_FLAG_CODES = new Set(Object.values(COUNTRY_FLAG_CODES));

function normalizeCountryKey(value: string): string {
  return value
    .trim()
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ');
}

export function countryFlagCode(country: string | null | undefined): string | null {
  if (!country) return null;

  const trimmed = normalizeCountryKey(country);
  if (!trimmed) return null;

  // Already an ISO / flagcdn code (e.g. "MK" from some flight payloads).
  if (trimmed.length === 2) {
    const iso = trimmed.toLowerCase();
    if (KNOWN_FLAG_CODES.has(iso) || iso === 'xk') return iso;
  }

  const direct = COUNTRY_FLAG_CODES[trimmed];
  if (direct) return direct;

  const lowered = trimmed.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_FLAG_CODES)) {
    if (name.toLowerCase() === lowered) return code;
  }

  // Kiwi sometimes uses longer / older Macedonia labels.
  if (lowered.includes('macedonia')) return 'mk';

  return null;
}

export function countryFlagUrl(country: string | null | undefined, width = 40): string | null {
  const code = countryFlagCode(country);
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}
