/**
 * Ensure static marketing / tool / content routes are present in sitemap.xml
 * (idempotent). Programmatic city/OD URLs are handled by generate-seo-sitemap.mjs.
 *
 * Keep PATHS in sync with the static routes prerendered by
 * flight-search/frontend/scripts/prerender-seo.mjs.
 *
 * Run: node scripts/ensure-static-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.join(
  __dirname,
  '..',
  'flight-search',
  'frontend',
  'public',
  'sitemap.xml'
);

const SITE = 'https://euroweekender.com';

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

/** Routes that prerender-seo.mjs writes as static shells (excluding programmatic landings). */
const PATHS = [
  { path: '', changefreq: 'daily', priority: '1.0' }, // locale home /{lang}
  { path: 'cheapest-weekend', changefreq: 'daily', priority: '0.9' },
  { path: 'single-day-trips', changefreq: 'daily', priority: '0.9' },
  { path: 'how-it-works', changefreq: 'monthly', priority: '0.7' },
  { path: 'about', changefreq: 'monthly', priority: '0.6' },
  { path: 'faq', changefreq: 'monthly', priority: '0.6' },
  { path: 'contact', changefreq: 'monthly', priority: '0.5' },
  { path: 'privacy', changefreq: 'yearly', priority: '0.3' },
  { path: 'terms', changefreq: 'yearly', priority: '0.3' }
];

function locFor(locale, routePath) {
  return routePath ? `${SITE}/${locale}/${routePath}` : `${SITE}/${locale}`;
}

function alternateLinks(routePath) {
  const lines = LOCALES.map(
    code => `    <xhtml:link rel="alternate" hreflang="${code}" href="${locFor(code, routePath)}" />`
  );
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${locFor('en', routePath)}" />`);
  return lines.join('\n');
}

function urlBlock(locale, routePath, changefreq, priority) {
  return `  <url>
    <loc>${locFor(locale, routePath)}</loc>
${alternateLinks(routePath)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

let xml = fs.readFileSync(sitemapPath, 'utf8');
const blocks = [];
let skipped = 0;

for (const { path: routePath, changefreq, priority } of PATHS) {
  for (const locale of LOCALES) {
    const needle = `<loc>${locFor(locale, routePath)}</loc>`;
    if (xml.includes(needle)) {
      skipped += 1;
      continue;
    }
    blocks.push(urlBlock(locale, routePath, changefreq, priority));
  }
}

if (blocks.length === 0) {
  console.log(`ensure-static-sitemap: all ${skipped} static URL entries already present`);
  process.exit(0);
}

if (!xml.trimEnd().endsWith('</urlset>')) {
  throw new Error('sitemap does not end with </urlset>');
}

xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blocks.join('\n')}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log(`ensure-static-sitemap: added ${blocks.length} url entries (${skipped} already present)`);
