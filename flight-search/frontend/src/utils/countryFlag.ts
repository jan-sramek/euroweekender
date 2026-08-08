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

export function countryFlagCode(country: string | null | undefined): string | null {
  if (!country) return null;
  const direct = COUNTRY_FLAG_CODES[country.trim()];
  if (direct) return direct;

  const lowered = country.trim().toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_FLAG_CODES)) {
    if (name.toLowerCase() === lowered) return code;
  }
  return null;
}

export function countryFlagUrl(country: string | null | undefined, width = 40): string | null {
  const code = countryFlagCode(country);
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}
