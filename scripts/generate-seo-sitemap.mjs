/**
 * Regenerates the programmatic SEO sections of sitemap.xml (idempotent):
 *   - weekend-flights-from/{slug}   (hubs × English + local language)
 *   - day-trips-from/{slug}         (hubs × English + local language)
 *   - weekend-flights/{from-to-to}  (first 40 hubs × first 12 popular destinations,
 *                                    origin English + local language, from != to)
 *
 * City landings are indexed in English plus the language spoken in that city,
 * not every UI locale. Static pages are handled by ensure-static-sitemap.mjs.
 *
 * Run: node scripts/generate-seo-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { indexableLocalesForHub } from './seo-city-locales.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'flight-search', 'frontend', 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const hubsPath = path.join(publicDir, 'seo-hub-cities.json');
const popularDestinationsPath = path.join(publicDir, 'seo-popular-destinations.json');

const OD_HUB_LIMIT = 40;
const OD_DESTINATION_LIMIT = 12;
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

function alternateLinks(routePath, locales) {
  const lines = locales.map(
    code => `    <xhtml:link rel="alternate" hreflang="${code}" href="${SITE}/${code}/${routePath}" />`
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/en/${routePath}" />`
  );
  return lines.join('\n');
}

function urlBlock(locale, routePath, locales) {
  return `  <url>
    <loc>${SITE}/${locale}/${routePath}</loc>
${alternateLinks(routePath, locales)}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
}

function addCityLocaleBlocks(blocks, hubs, pathPrefix) {
  let count = 0;
  for (const hub of hubs) {
    const locales = indexableLocalesForHub(hub);
    const routePath = `${pathPrefix}/${buildCitySlug(hub)}`;
    for (const locale of locales) {
      blocks.push(urlBlock(locale, routePath, locales));
      count += 1;
    }
  }
  return count;
}

/** @type {{ code: string; name: string; country?: string }[]} */
const hubs = JSON.parse(fs.readFileSync(hubsPath, 'utf8'));
/** @type {{ code: string; name: string }[]} */
const popularDestinations = JSON.parse(fs.readFileSync(popularDestinationsPath, 'utf8'));

let xml = fs.readFileSync(sitemapPath, 'utf8');

xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/weekend-flights-from\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/day-trips-from\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/weekend-flights\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');

const blocks = [];

const fromCount = addCityLocaleBlocks(blocks, hubs, 'weekend-flights-from');
console.log('weekend-flights-from entries:', fromCount);

const dayCount = addCityLocaleBlocks(blocks, hubs, 'day-trips-from');
console.log('day-trips-from entries:', dayCount);

const odHubs = hubs.slice(0, OD_HUB_LIMIT);
const odDestinations = popularDestinations.slice(0, OD_DESTINATION_LIMIT);
let odCount = 0;
for (const hub of odHubs) {
  const locales = indexableLocalesForHub(hub);
  for (const destination of odDestinations) {
    if (hub.code.toUpperCase() === destination.code.toUpperCase()) continue;
    const routePath = `weekend-flights/${buildCitySlug(hub)}-to-${buildCitySlug(destination)}`;
    for (const locale of locales) {
      blocks.push(urlBlock(locale, routePath, locales));
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
