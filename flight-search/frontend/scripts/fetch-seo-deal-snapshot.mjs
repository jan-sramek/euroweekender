/**
 * Fetches hub scores + top destinations from the public API and writes
 * public/seo-deal-snapshot.json for prerender (and optional client fallback).
 *
 * Env:
 *   SEO_API_BASE  – default https://euroweekender.com/api
 *
 * Run: node scripts/fetch-seo-deal-snapshot.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..');
const publicDir = path.join(frontendDir, 'public');
const hubsPath = path.join(publicDir, 'seo-hub-cities.json');
const outPath = path.join(publicDir, 'seo-deal-snapshot.json');

const API_BASE = (process.env.SEO_API_BASE || 'https://euroweekender.com/api').replace(/\/$/, '');
const WEEKS = 4;
const DEST_LIMIT = 12;
const CONCURRENCY = 8;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const headers = { Accept: 'application/json', 'User-Agent': 'euroweekender-seo-snapshot/1.0' };
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`${url} → HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    const code = error?.cause?.code || error?.code;
    if (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
      // Some deploy environments present a cert chain Node does not trust; curl still works.
      console.warn('seo-snapshot: retrying with NODE_TLS_REJECT_UNAUTHORIZED=0');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`${url} → HTTP ${response.status}`);
      }
      return response.json();
    }
    throw error;
  }
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

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

function normalizeHub(raw) {
  const code = String(raw.code ?? raw.Code ?? '')
    .trim()
    .toUpperCase();
  if (!code) return null;
  return {
    code,
    offerCount: Number(raw.offerCount ?? raw.OfferCount ?? 0),
    minPrice: Number(raw.minPrice ?? raw.MinPrice ?? 0),
    destinationCount: Number(raw.destinationCount ?? raw.DestinationCount ?? 0),
    hubScore: Number(raw.hubScore ?? raw.HubScore ?? 0)
  };
}

function normalizeDestination(raw, nameByCode) {
  const code = String(raw.code ?? raw.Code ?? '')
    .trim()
    .toUpperCase();
  if (!code) return null;
  const minPrice = Number(raw.minPrice ?? raw.MinPrice ?? 0);
  const offerCount = Number(raw.offerCount ?? raw.OfferCount ?? 0);
  return {
    code,
    name: nameByCode.get(code) || code,
    minPrice,
    offerCount
  };
}

export async function fetchSeoDealSnapshot({ write = true } = {}) {
  const hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf8'));
  const hubCodes = hubs.map(h => String(h.code).trim().toUpperCase()).filter(Boolean);

  console.log(`seo-snapshot: fetching hub-scores from ${API_BASE}…`);
  const hubScoresRaw = await fetchJson(`${API_BASE}/cities/hub-scores?weeks=${WEEKS}`);
  const hubScores = (Array.isArray(hubScoresRaw) ? hubScoresRaw : [])
    .map(normalizeHub)
    .filter(Boolean);

  const hubsByCode = Object.fromEntries(hubScores.map(score => [score.code, score]));

  console.log(`seo-snapshot: loading city names…`);
  const citiesRaw = await fetchJson(`${API_BASE}/cities`);
  const nameByCode = new Map();
  for (const city of Array.isArray(citiesRaw) ? citiesRaw : []) {
    const code = String(city.code ?? city.Code ?? '')
      .trim()
      .toUpperCase();
    const name = String(city.name ?? city.Name ?? '').trim();
    if (code && name) nameByCode.set(code, name);
  }
  for (const hub of hubs) {
    const code = String(hub.code).trim().toUpperCase();
    if (code && hub.name) nameByCode.set(code, hub.name);
  }

  console.log(`seo-snapshot: fetching top destinations for ${hubCodes.length} hubs…`);
  const destinationsByOrigin = {};
  let fetched = 0;
  let failed = 0;

  await mapPool(hubCodes, CONCURRENCY, async code => {
    try {
      const raw = await fetchJson(
        `${API_BASE}/cities/${encodeURIComponent(code)}/top-destinations?weeks=${WEEKS}&limit=${DEST_LIMIT}`
      );
      destinationsByOrigin[code] = (Array.isArray(raw) ? raw : [])
        .map(item => normalizeDestination(item, nameByCode))
        .filter(Boolean);
      fetched += 1;
    } catch (error) {
      failed += 1;
      destinationsByOrigin[code] = [];
      if (failed <= 5) {
        console.warn(`seo-snapshot: ${code} failed:`, error.message);
      }
    }
    // Light pacing so we do not stampede the API.
    await sleep(20);
  });

  const snapshot = {
    fetchedAt: new Date().toISOString(),
    weeks: WEEKS,
    apiBase: API_BASE,
    hubs: hubsByCode,
    destinationsByOrigin
  };

  if (write) {
    fs.writeFileSync(outPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    console.log(
      `seo-snapshot: wrote ${outPath} (hubs=${Object.keys(hubsByCode).length}, origins=${fetched}, failed=${failed})`
    );
  }

  return snapshot;
}

function loadCachedSnapshot() {
  if (!fs.existsSync(outPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch {
    return null;
  }
}

/** Prefer a fresh API snapshot; fall back to the last committed file. */
export async function loadSeoDealSnapshot() {
  const cached = loadCachedSnapshot();
  const maxAgeMs = Number(process.env.SEO_SNAPSHOT_MAX_AGE_MS || 12 * 60 * 60 * 1000);
  const force = process.env.SEO_SNAPSHOT_FORCE === '1';

  if (!force && cached?.fetchedAt) {
    const age = Date.now() - Date.parse(cached.fetchedAt);
    if (Number.isFinite(age) && age >= 0 && age < maxAgeMs) {
      console.log(`seo-snapshot: using cached file from ${cached.fetchedAt}`);
      return cached;
    }
  }

  try {
    return await fetchSeoDealSnapshot({ write: true });
  } catch (error) {
    if (cached) {
      console.warn(`seo-snapshot: live fetch failed (${error.message}); using cached ${outPath}`);
      return cached;
    }
    console.warn(`seo-snapshot: no live data and no cache (${error.message})`);
    return { fetchedAt: null, weeks: WEEKS, hubs: {}, destinationsByOrigin: {} };
  }
}

const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  fetchSeoDealSnapshot()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('seo-snapshot failed:', error);
      process.exit(1);
    });
}
