/**
 * Append weekend-flights-from hub URLs to sitemap.xml (idempotent).
 * Run: node scripts/generate-city-sitemap.mjs
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
const hubsPath = path.join(
  __dirname,
  '..',
  'flight-search',
  'frontend',
  'public',
  'seo-hub-cities.json'
);

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

let xml = fs.readFileSync(sitemapPath, 'utf8');
xml = xml.replace(/\n\s*<url>\s*\n\s*<loc>[^<]*\/weekend-flights-from\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');

const blocks = [];
for (const hub of hubs) {
  const slug = buildCitySlug(hub);
  const routePath = `weekend-flights-from/${slug}`;
  for (const locale of LOCALES) {
    blocks.push(urlBlock(locale, routePath));
  }
}

if (!xml.trimEnd().endsWith('</urlset>')) {
  throw new Error('sitemap does not end with </urlset>');
}

xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blocks.join('\n')}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log('added', blocks.length, 'weekend-flights-from url entries for', hubs.length, 'hubs');
