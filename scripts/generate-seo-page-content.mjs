/**
 * Pre-generates unique SEO copy for city / OD landings and writes:
 *   - flight-search/frontend/public/seo-page-content.json (prerender + SPA fallback)
 *   - optional upsert into Postgres (`--import-db`) using the API connection string
 *   - optional PUT into the API (`--import`) if SEO_IMPORT_KEY is set
 *
 * Only English + languages spoken at the origin city are generated (same rule as
 * the sitemap). Unique text comes from Wikipedia extracts in that language,
 * composed with the existing localized templates and route facts.
 *
 * Env:
 *   SEO_API_BASE       – default https://euroweekender.com/api (used with --import)
 *   SEO_IMPORT_KEY     – required for --import (header X-Seo-Import-Key)
 *
 * Run:
 *   node scripts/generate-seo-page-content.mjs
 *   node scripts/generate-seo-page-content.mjs --only PRG
 *   node scripts/generate-seo-page-content.mjs --import-db
 *   node scripts/generate-seo-page-content.mjs --force --import
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { indexableLocalesForHub } from './seo-city-locales.mjs';
import { SEO_PAGE_TYPES, seoContentKey } from './seo-page-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'flight-search', 'frontend', 'public');
const localesDir = path.join(__dirname, '..', 'flight-search', 'frontend', 'src', 'locales');
const outPath = path.join(publicDir, 'seo-page-content.json');

const OD_HUB_LIMIT = 40;
const OD_DESTINATION_LIMIT = 12;
const USER_AGENT = 'euroweekender-seo-content/1.0 (https://euroweekender.com; hello@euroweekender.com)';
const WIKI_CONCURRENCY = 6;
const WIKIVOYAGE_LOCALES = new Set([
  'en',
  'de',
  'es',
  'fr',
  'it',
  'nl',
  'pt',
  'ru',
  'uk',
  'pl',
  'fi',
  'sv',
  'el',
  'ro'
]);

/** Wikipedia titles when the English city name is ambiguous. */
const WIKI_TITLES = {
  ACE: 'Arrecife',
  AGP: 'Málaga',
  CIA: 'Rome',
  CRL: 'Charleroi',
  DUS: 'Düsseldorf',
  FAO: 'Faro, Portugal',
  FCO: 'Rome',
  FUE: 'Puerto del Rosario',
  GDN: 'Gdańsk',
  GVA: 'Geneva',
  IBZ: 'Ibiza',
  KRK: 'Kraków',
  LPA: 'Las Palmas',
  MLA: 'Valletta',
  NCE: 'Nice, France',
  OPO: 'Porto',
  PMI: 'Palma de Mallorca',
  POZ: 'Poznań',
  REK: 'Reykjavík',
  ROM: 'Rome',
  TFS: 'Santa Cruz de Tenerife',
  WRO: 'Wrocław'
};

const EARTH_RADIUS_KM = 6371;
const CRUISE_KMH = 780;
const BLOCK_OVERHEAD_MINUTES = 40;
const MIN_DURATION_MINUTES = 45;

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const doImport = args.has('--import');
const doImportDb = args.has('--import-db');
const dryRun = args.has('--dry-run');
const onlyIndex = process.argv.indexOf('--only');
const onlyCode =
  onlyIndex >= 0 && process.argv[onlyIndex + 1]
    ? process.argv[onlyIndex + 1].trim().toUpperCase()
    : '';

const localeCache = new Map();
function loadLocale(lang) {
  if (!localeCache.has(lang)) {
    const file = path.join(localesDir, `${lang}.json`);
    localeCache.set(lang, JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  return localeCache.get(lang);
}
const enLocale = loadLocale('en');

function getPath(obj, dotPath) {
  return dotPath.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);
}

function interpolate(value, vars) {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : ''));
  }
  if (Array.isArray(value)) return value.map(item => interpolate(item, vars));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, interpolate(v, vars)]));
  }
  return value;
}

function t(lang, dotPath, vars = {}) {
  const value = getPath(loadLocale(lang), dotPath) ?? getPath(enLocale, dotPath);
  return interpolate(value ?? '', vars);
}

function coordsFor(coords, code) {
  const pair = coords[String(code).trim().toUpperCase()];
  if (!Array.isArray(pair) || pair.length < 2) return null;
  return { latitude: pair[0], longitude: pair[1] };
}

function haversineKm(from, to) {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFlightDurationMinutes(distanceKm) {
  const cruiseMinutes = (distanceKm / CRUISE_KMH) * 60;
  const total = cruiseMinutes + BLOCK_OVERHEAD_MINUTES;
  return Math.max(MIN_DURATION_MINUTES, Math.round(total / 5) * 5);
}

function roundDistanceKm(distanceKm) {
  if (distanceKm < 100) return Math.max(1, Math.round(distanceKm / 5) * 5);
  return Math.round(distanceKm / 10) * 10;
}

function formatDurationLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}min`;
}

function computeRouteFacts(coords, fromCode, toCode) {
  const from = coordsFor(coords, fromCode);
  const to = coordsFor(coords, toCode);
  if (!from || !to) return null;
  if (String(fromCode).toUpperCase() === String(toCode).toUpperCase()) return null;
  const distance = haversineKm(from, to);
  if (!Number.isFinite(distance) || distance < 1) return null;
  const durationMinutes = estimateFlightDurationMinutes(distance);
  return {
    distanceKm: roundDistanceKm(distance),
    durationMinutes,
    durationLabel: formatDurationLabel(durationMinutes)
  };
}

function wikiTitleForCity(city) {
  const override = WIKI_TITLES[String(city.code).toUpperCase()];
  return override ?? String(city.name || '').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': USER_AGENT,
          'Api-User-Agent': USER_AGENT
        }
      });
      if (response.status === 404) return { notFound: true };
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`${url} → HTTP ${response.status}`);
        await sleep(300 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);
      return { data: await response.json() };
    } catch (error) {
      lastError = error;
      await sleep(200 * (attempt + 1));
    }
  }
  throw lastError;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function firstSentence(text) {
  const trimmed = String(text || '').replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const match = trimmed.match(/^.+?[.!?](?=\s|$)/);
  if (!match) return trimmed.length > 280 ? `${trimmed.slice(0, 277).trim()}…` : trimmed;
  // Avoid splitting on decimals ("13. nejlidnatějším").
  if (/^\d$/.test(match[0].slice(-2, -1)) && trimmed.length > match[0].length) {
    const rest = trimmed.slice(match[0].length);
    const extra = rest.match(/^.+?[.!?](?=\s|$)/);
    return extra ? `${match[0]}${extra[0]}`.trim() : trimmed.slice(0, 280).trim();
  }
  return match[0].trim();
}

function knownForAnswer(name, wiki) {
  if (wiki?.description) return `${name} — ${wiki.description}.`;
  return firstSentence(wiki?.extract || '');
}

function clipMeta(text, max = 160) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const sliced = compact.slice(0, max - 1);
  const cut = sliced.lastIndexOf(' ');
  return `${(cut > 80 ? sliced.slice(0, cut) : sliced).trim()}…`;
}

function clipExtract(text, max = 720) {
  const compact = String(text || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const parts = compact.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const part of parts) {
    if (!part) continue;
    if (out && out.length + part.length + 1 > max) break;
    out = out ? `${out} ${part}` : part;
  }
  return out || `${compact.slice(0, max - 1).trim()}…`;
}

function uniqueParagraphs(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const text = String(item || '').replace(/\s+/g, ' ').trim();
    if (text.length < 40) continue;
    const key = text.slice(0, 80).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

const wikiCache = new Map();

function cached(key, loader) {
  if (wikiCache.has(key)) return wikiCache.get(key);
  const pending = Promise.resolve()
    .then(loader)
    .then(result => {
      wikiCache.set(key, Promise.resolve(result));
      return result;
    })
    .catch(error => {
      wikiCache.delete(key);
      throw error;
    });
  wikiCache.set(key, pending);
  return pending;
}

function pageFromQuery(data) {
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page || page.missing != null || page.invalid != null) return null;
  return page;
}

async function wikipediaSummary(lang, title) {
  if (!lang || !title) return null;
  return cached(`wiki:${lang}:${title}`, async () => {
    const url =
      `https://${lang}.wikipedia.org/w/api.php?action=query&redirects=1&format=json` +
      `&prop=extracts|description|info&exintro=1&explaintext=1&inprop=url` +
      `&titles=${encodeURIComponent(title)}`;
    const { data, notFound } = await fetchJson(url);
    if (notFound) return null;
    const page = pageFromQuery(data);
    if (!page) return null;
    const extract = String(page.extract || '').replace(/\s+/g, ' ').trim();
    if (extract.length < 40) return null;
    return {
      extract,
      description: String(page.description || '').trim(),
      title: String(page.title || title).trim(),
      url: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`
    };
  }).catch(() => null);
}

async function wikivoyageSummary(lang, title) {
  if (!WIKIVOYAGE_LOCALES.has(lang) || !title) return null;
  return cached(`voyage:${lang}:${title}`, async () => {
    const url =
      `https://${lang}.wikivoyage.org/w/api.php?action=query&redirects=1&format=json` +
      `&prop=extracts|info&exintro=1&explaintext=1&inprop=url` +
      `&titles=${encodeURIComponent(title)}`;
    const { data, notFound } = await fetchJson(url);
    if (notFound) return null;
    const page = pageFromQuery(data);
    const extract = String(page?.extract || '').replace(/\s+/g, ' ').trim();
    if (!page || extract.length < 40) return null;
    return { extract, title: String(page.title || title).trim() };
  }).catch(() => null);
}

async function langLinksForTitle(englishTitle) {
  return cached(`links:${englishTitle}`, async () => {
    const url =
      'https://en.wikipedia.org/w/api.php?action=query&redirects=1&prop=langlinks&lllimit=500&format=json' +
      `&titles=${encodeURIComponent(englishTitle)}`;
    const { data } = await fetchJson(url);
    const page = pageFromQuery(data);
    const map = { en: englishTitle };
    for (const link of page?.langlinks || []) {
      if (link.lang && link['*']) map[link.lang] = link['*'];
    }
    return map;
  }).catch(() => ({ en: englishTitle }));
}

async function cityCopy(city, locale) {
  const englishTitle = wikiTitleForCity(city);
  const links = await langLinksForTitle(englishTitle);
  const localizedTitle = links[locale] || (locale === 'en' ? englishTitle : city.name);
  const titles = [...new Set([localizedTitle, englishTitle, city.name].filter(Boolean))];
  let wiki = null;
  let usedTitle = localizedTitle;
  for (const title of titles) {
    wiki = await wikipediaSummary(locale, title);
    if (wiki) {
      usedTitle = wiki.title || title;
      break;
    }
  }
  const voyage = usedTitle ? await wikivoyageSummary(locale, usedTitle) : null;
  return {
    displayName: wiki?.title || localizedTitle || city.name,
    wiki,
    voyage
  };
}

function asFaq(value) {
  return Array.isArray(value) ? value.filter(item => item?.q && item?.a) : [];
}

function composeWeekendFrom(locale, city, copy) {
  const name = copy.displayName || city.name;
  const vars = { city: name };
  const wiki = copy.wiki;
  const leadParts = [];
  if (wiki?.description) leadParts.push(`${name} — ${wiki.description}.`);
  leadParts.push(t(locale, 'weekendFlightsFrom.lead', vars));
  const lead = leadParts.join(' ');
  const paragraphs = uniqueParagraphs([
    clipExtract(wiki?.extract),
    clipExtract(copy.voyage?.extract),
    t(locale, 'weekendFlightsFrom.seoBlock', vars)
  ]);
  const faq = asFaq(t(locale, 'weekendFlightsFrom.faq', vars));
  if (wiki?.extract) {
    faq.unshift({
      q: t(locale, 'seoUnique.knownForQ', vars),
      a: knownForAnswer(name, wiki)
    });
  }
  return {
    pageType: SEO_PAGE_TYPES.weekendFrom,
    originCode: city.code.toUpperCase(),
    destinationCode: '',
    locale,
    lead,
    heading: t(locale, 'seoUnique.aboutTitle', vars),
    metaDescription: clipMeta(wiki?.extract || lead),
    paragraphs,
    faq,
    sourceUrl: wiki?.url || null,
    sourceTitle: wiki?.title || null
  };
}

function composeDayTripsFrom(locale, city, copy) {
  const name = copy.displayName || city.name;
  const vars = { city: name };
  const wiki = copy.wiki;
  const leadParts = [];
  if (wiki?.description) leadParts.push(`${name} — ${wiki.description}.`);
  leadParts.push(t(locale, 'dayTripsFrom.lead', vars));
  const lead = leadParts.join(' ');
  const paragraphs = uniqueParagraphs([
    clipExtract(wiki?.extract),
    clipExtract(copy.voyage?.extract),
    t(locale, 'dayTripsFrom.seoBlock', vars)
  ]);
  const faq = asFaq(t(locale, 'dayTripsFrom.faq', vars));
  if (wiki?.extract) {
    faq.unshift({
      q: t(locale, 'seoUnique.knownForQ', vars),
      a: knownForAnswer(name, wiki)
    });
  }
  return {
    pageType: SEO_PAGE_TYPES.dayTripsFrom,
    originCode: city.code.toUpperCase(),
    destinationCode: '',
    locale,
    lead,
    heading: t(locale, 'seoUnique.aboutTitle', vars),
    metaDescription: clipMeta(wiki?.extract || lead),
    paragraphs,
    faq,
    sourceUrl: wiki?.url || null,
    sourceTitle: wiki?.title || null
  };
}

function composeWeekendOd(locale, fromCity, toCity, fromCopy, toCopy, facts) {
  const fromName = fromCopy.displayName || fromCity.name;
  const toName = toCopy.displayName || toCity.name;
  const vars = {
    from: fromName,
    to: toName,
    city: toName,
    duration: facts?.durationLabel ?? '',
    distanceKm: facts?.distanceKm ?? ''
  };
  const wiki = toCopy.wiki;
  const leadParts = [];
  if (wiki?.description) leadParts.push(`${toName} — ${wiki.description}.`);
  leadParts.push(t(locale, 'weekendFlightsOd.lead', vars));
  const lead = leadParts.join(' ');
  const paragraphs = uniqueParagraphs([
    clipExtract(wiki?.extract),
    clipExtract(toCopy.voyage?.extract),
    facts ? t(locale, 'weekendFlightsOd.durationHint', vars) : '',
    t(locale, 'weekendFlightsOd.weekendPatternHint', vars),
    t(locale, 'weekendFlightsOd.seoBlock', vars)
  ]);
  const faq = asFaq(t(locale, 'weekendFlightsOd.faq', vars));
  if (wiki?.extract) {
    faq.unshift({
      q: t(locale, 'seoUnique.knownForQ', { city: toName }),
      a: knownForAnswer(toName, wiki)
    });
  }
  return {
    pageType: SEO_PAGE_TYPES.weekendOd,
    originCode: fromCity.code.toUpperCase(),
    destinationCode: toCity.code.toUpperCase(),
    locale,
    lead,
    heading: t(locale, 'seoUnique.aboutTitle', { city: toName }),
    metaDescription: clipMeta(wiki?.extract || lead),
    paragraphs,
    faq,
    sourceUrl: wiki?.url || null,
    sourceTitle: wiki?.title || null
  };
}

function loadExistingPages() {
  if (force || !fs.existsSync(outPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    return parsed.pages && typeof parsed.pages === 'object' ? parsed.pages : {};
  } catch {
    return {};
  }
}

function enumerateJobs(hubs, destinations) {
  const jobs = [];
  for (const hub of hubs) {
    if (onlyCode && hub.code.toUpperCase() !== onlyCode) continue;
    const locales = indexableLocalesForHub(hub);
    for (const locale of locales) {
      jobs.push({ kind: SEO_PAGE_TYPES.weekendFrom, hub, locale });
      jobs.push({ kind: SEO_PAGE_TYPES.dayTripsFrom, hub, locale });
    }
  }

  const odHubs = hubs.slice(0, OD_HUB_LIMIT);
  const odDestinations = destinations.slice(0, OD_DESTINATION_LIMIT);
  for (const hub of odHubs) {
    if (onlyCode && hub.code.toUpperCase() !== onlyCode) continue;
    const locales = indexableLocalesForHub(hub);
    for (const destination of odDestinations) {
      if (hub.code.toUpperCase() === destination.code.toUpperCase()) continue;
      for (const locale of locales) {
        jobs.push({ kind: SEO_PAGE_TYPES.weekendOd, hub, destination, locale });
      }
    }
  }
  return jobs;
}

function importSnapshotToPostgres(jsonPath) {
  const repoRoot = path.join(__dirname, '..');
  return new Promise((resolve, reject) => {
    const child = spawn(
      'dotnet',
      ['run', '--project', 'WeekendFlights.Api', '--', '--import-seo-content', jsonPath],
      { cwd: repoRoot, stdio: 'inherit' }
    );
    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`dotnet SEO import exited ${code}`));
    });
  });
}

async function importSnapshot(snapshot) {
  const apiBase = (process.env.SEO_API_BASE || 'https://euroweekender.com/api').replace(/\/$/, '');
  const key = process.env.SEO_IMPORT_KEY || '';
  if (!key) {
    throw new Error('SEO_IMPORT_KEY is required for --import');
  }
  const response = await fetch(`${apiBase}/seo-content/import`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Seo-Import-Key': key,
      'User-Agent': USER_AGENT
    },
    body: JSON.stringify(snapshot)
  });
  if (!response.ok) {
    throw new Error(`import failed: HTTP ${response.status}`);
  }
}

async function main() {
  const hubs = JSON.parse(fs.readFileSync(path.join(publicDir, 'seo-hub-cities.json'), 'utf8'));
  const destinations = JSON.parse(
    fs.readFileSync(path.join(publicDir, 'seo-popular-destinations.json'), 'utf8')
  );
  const coords = JSON.parse(fs.readFileSync(path.join(publicDir, 'seo-city-coords.json'), 'utf8'));
  const jobs = enumerateJobs(hubs, destinations);

  if (dryRun) {
    console.log(`seo-page-content: ${jobs.length} pages (dry run)`);
    return;
  }

  const pages = loadExistingPages();

  let generated = 0;
  let reused = 0;
  let skipped = 0;

  await mapPool(jobs, WIKI_CONCURRENCY, async job => {
    const destCode = job.destination?.code;
    const key = seoContentKey(job.kind, job.hub.code, destCode, job.locale);
    if (!force && pages[key]?.paragraphs?.length) {
      reused += 1;
      return;
    }

    try {
      if (job.kind === SEO_PAGE_TYPES.weekendOd) {
        const [fromCopy, toCopy] = await Promise.all([
          cityCopy(job.hub, job.locale),
          cityCopy(job.destination, job.locale)
        ]);
        const facts = computeRouteFacts(coords, job.hub.code, job.destination.code);
        pages[key] = {
          ...composeWeekendOd(job.locale, job.hub, job.destination, fromCopy, toCopy, facts),
          generatedAt: new Date().toISOString()
        };
      } else {
        const copy = await cityCopy(job.hub, job.locale);
        const compose =
          job.kind === SEO_PAGE_TYPES.dayTripsFrom ? composeDayTripsFrom : composeWeekendFrom;
        pages[key] = {
          ...compose(job.locale, job.hub, copy),
          generatedAt: new Date().toISOString()
        };
      }
      generated += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`seo-page-content: skip ${key}: ${error.message}`);
    }
    await sleep(40);
  });

  const snapshot = {
    generatedAt: new Date().toISOString(),
    pageCount: Object.keys(pages).length,
    pages
  };
  fs.writeFileSync(outPath, `${JSON.stringify(snapshot)}\n`);
  console.log(
    `seo-page-content: wrote ${snapshot.pageCount} pages (${generated} new, ${reused} reused, ${skipped} skipped) → ${outPath}`
  );

  if (doImportDb) {
    await importSnapshotToPostgres(outPath);
    console.log('seo-page-content: imported into Postgres');
  }

  if (doImport) {
    await importSnapshot(snapshot);
    console.log('seo-page-content: imported into API');
  }
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectRun) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
