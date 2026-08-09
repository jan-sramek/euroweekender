/**
 * Regenerates the programmatic SEO sections of sitemap.xml (idempotent):
 *   - weekend-flights-from/{slug}          (all hubs x all locales)
 *   - day-trips-from/{slug}                (all hubs x all locales)
 *   - weekend-flights/{from-to-to}         (first 40 hubs x first 12 popular
 *                                            destinations x all locales, from != to)
 *
 * The origin-destination cross product is intentionally capped (40 x 12) to avoid
 * an unbounded number of URLs — see AGENTS/task notes for rationale.
 *
 * Run: node scripts/generate-seo-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'flight-search', 'frontend', 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const hubsPath = path.join(publicDir, 'seo-hub-cities.json');
const popularDestinationsPath = path.join(publicDir, 'seo-popular-destinations.json');

const OD_HUB_LIMIT = 40;
const OD_DESTINATION_LIMIT = 12;
/**
 * OD pages get a <url> entry (with full hreflang alternates) only for these locales to keep
 * the sitemap file size reasonable (40 x 12 x 25 locales would add ~35MB by itself). Every
 * locale is still discoverable through the hreflang alternate links embedded in each block.
 */
const OD_SITEMAP_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'cs'];

const LOCALES = [
  'en',
  'de',
  'fr',
  'es',
  'it',
  'pl',
  'nl',
  'ro',
  'tr',
  'pt',
  'cs',
  'hu',
  'el',
  'sv',
  'uk',
  'ru',
  'bg',
  'da',
  'fi',
  'sk',
  'no',
  'lt',
  'lv',
  'et',
  'is'
];

const SITE = 'https://euroweekender.com';

function slugifyCityName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildCitySlug(city) {
  const code = city.code.trim().toUpperCase();
  const base = slugifyCityName(city.name) || code.toLowerCase();
  return `${base}-${code.toLowerCase()}`;
}

function alternateLinks(routePath) {
  const lines = LOCALES.map(
    code => `    <xhtml:link rel="alternate" hreflang="${code}" href="${SITE}/${code}/${routePath}" />`
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/en/${routePath}" />`
  );
  return lines.join('\n');
}

function urlBlock(locale, routePath) {
  return `  <url>
    <loc>${SITE}/${locale}/${routePath}</loc>
${alternateLinks(routePath)}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}

/** @type {{ code: string; name: string }[]} */
const hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf8'));
/** @type {{ code: string; name: string }[]} */
const popularDestinations = JSON.parse(fs.readFileSync(popularDestinationsPath, 'utf8'));

let xml = fs.readFileSync(sitemapPath, 'utf8');

// Strip previously generated blocks so this script stays idempotent.
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/weekend-flights-from\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/day-trips-from\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/weekend-flights\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');

const blocks = [];

// weekend-flights-from: all hubs x all locales.
for (const hub of hubs) {
  const routePath = `weekend-flights-from/${buildCitySlug(hub)}`;
  for (const locale of LOCALES) {
    blocks.push(urlBlock(locale, routePath));
  }
}
console.log('weekend-flights-from entries:', hubs.length * LOCALES.length);

// day-trips-from: all hubs x all locales.
for (const hub of hubs) {
  const routePath = `day-trips-from/${buildCitySlug(hub)}`;
  for (const locale of LOCALES) {
    blocks.push(urlBlock(locale, routePath));
  }
}
console.log('day-trips-from entries:', hubs.length * LOCALES.length);

// weekend-flights OD pairs: capped hub x destination cross product, from != to.
const odHubs = hubs.slice(0, OD_HUB_LIMIT);
const odDestinations = popularDestinations.slice(0, OD_DESTINATION_LIMIT);
let odCount = 0;
for (const hub of odHubs) {
  for (const destination of odDestinations) {
    if (hub.code.toUpperCase() === destination.code.toUpperCase()) continue;
    const routePath = `weekend-flights/${buildCitySlug(hub)}-to-${buildCitySlug(destination)}`;
    for (const locale of OD_SITEMAP_LOCALES) {
      blocks.push(urlBlock(locale, routePath));
      odCount += 1;
    }
  }
}
console.log('weekend-flights OD entries:', odCount);

if (!xml.trimEnd().endsWith('</urlset>')) {
  throw new Error('sitemap does not end with </urlset>');
}

xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blocks.join('\n')}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log('total added:', blocks.length, 'url entries');
