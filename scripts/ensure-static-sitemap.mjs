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
import { LOCALES, STATIC_INDEXABLE_LOCALES } from './seo-locales.mjs';

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripUrlBlock(xml, loc) {
  return xml.replace(
    new RegExp(`\\s*<url>\\s*\\n\\s*<loc>${escapeRegex(loc)}</loc>[\\s\\S]*?</url>`, 'g'),
    ''
  );
}

function alternateLinks(routePath) {
  const lines = STATIC_INDEXABLE_LOCALES.map(
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

// Rebuild static entries so non-indexable locales leave the sitemap
// and remaining hreflang graphs no longer point at them.
for (const { path: routePath } of PATHS) {
  for (const locale of LOCALES) {
    xml = stripUrlBlock(xml, locFor(locale, routePath));
  }
}

const blocks = [];
for (const { path: routePath, changefreq, priority } of PATHS) {
  for (const locale of STATIC_INDEXABLE_LOCALES) {
    blocks.push(urlBlock(locale, routePath, changefreq, priority));
  }
}

if (!xml.trimEnd().endsWith('</urlset>')) {
  throw new Error('sitemap does not end with </urlset>');
}

xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blocks.join('\n')}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log(
  `ensure-static-sitemap: wrote ${blocks.length} static url entries (${STATIC_INDEXABLE_LOCALES.length} locales)`
);
