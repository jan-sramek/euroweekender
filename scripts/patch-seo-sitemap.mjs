/**
 * Append /cheapest-weekend and /single-day-trips URL blocks to sitemap.xml
 * Run: node scripts/patch-seo-sitemap.mjs
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

const PATHS = [
  { path: 'cheapest-weekend', changefreq: 'daily', priority: '0.9' },
  { path: 'single-day-trips', changefreq: 'daily', priority: '0.9' }
];

function alternateLinks(routePath) {
  const lines = LOCALES.map(
    code =>
      `    <xhtml:link rel="alternate" hreflang="${code}" href="https://euroweekender.com/${code}/${routePath}" />`
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="https://euroweekender.com/en/${routePath}" />`
  );
  return lines.join('\n');
}

function urlBlock(locale, routePath, changefreq, priority) {
  return `  <url>
    <loc>https://euroweekender.com/${locale}/${routePath}</loc>
${alternateLinks(routePath)}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

let xml = fs.readFileSync(sitemapPath, 'utf8');

for (const { path: routePath } of PATHS) {
  if (xml.includes(`/${routePath}</loc>`)) {
    console.log('already present:', routePath);
    continue;
  }
}

const blocks = [];
for (const { path: routePath, changefreq, priority } of PATHS) {
  if (xml.includes(`/${routePath}</loc>`)) continue;
  for (const locale of LOCALES) {
    blocks.push(urlBlock(locale, routePath, changefreq, priority));
  }
}

if (blocks.length === 0) {
  console.log('nothing to add');
  process.exit(0);
}

if (!xml.trimEnd().endsWith('</urlset>')) {
  throw new Error('sitemap does not end with </urlset>');
}

xml = xml.replace(/\s*<\/urlset>\s*$/, `\n${blocks.join('\n')}\n</urlset>\n`);
fs.writeFileSync(sitemapPath, xml);
console.log('added', blocks.length, 'url entries');
