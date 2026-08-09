/**
 * Post-build step: writes static, crawlable HTML shells for the programmatic SEO
 * landing pages (weekend-flights-from, day-trips-from, weekend-flights OD) by cloning
 * dist/index.html and patching the <head> tags + injecting a visible SEO block.
 *
 * This is intentionally lightweight (no headless browser / full prerender): the SPA
 * still boots normally and replaces the fallback content once React hydrates #root.
 *
 * Run after `vite build`: node scripts/prerender-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const publicDir = path.join(frontendDir, 'public');
const localesDir = path.join(frontendDir, 'src', 'locales');

const SITE_URL = 'https://euroweekender.com';
const SITE_TITLE = 'euroweekender.com';

// Keep in sync with scripts/generate-seo-sitemap.mjs at the repo root.
const OD_HUB_LIMIT = 40;
const OD_DESTINATION_LIMIT = 12;
const OD_PRERENDER_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'pl', 'nl', 'cs'];

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

function localizedPath(locale, routePath = '/') {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
  if (normalized === '/') return `/${locale}`;
  return `/${locale}${normalized}`;
}

// --- minimal i18n lookups (dot-path + {{var}} interpolation), mirrors src/locales/*.json ---

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
  if (Array.isArray(value)) {
    return value.map(item => interpolate(item, vars));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, interpolate(v, vars)]));
  }
  return value;
}

function t(lang, dotPath, vars = {}) {
  const value = getPath(loadLocale(lang), dotPath) ?? getPath(enLocale, dotPath);
  return interpolate(value ?? '', vars);
}

// --- HTML helpers ---

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHreflangLinks(routePath) {
  const links = LOCALES.map(
    code => `<link rel="alternate" hreflang="${code}" href="${SITE_URL}${localizedPath(code, routePath)}" />`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath('en', routePath)}" />`);
  return links.join('\n    ');
}

function buildJsonLdScripts(jsonLdBlocks) {
  return jsonLdBlocks
    .filter(Boolean)
    .map(data => `<script type="application/ld+json">${JSON.stringify(data)}</script>`)
    .join('\n    ');
}

function breadcrumbListJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function faqPageJsonLd(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };
}

function renderSeoFallbackBlock(h1, lead) {
  return `<div id="seo-fallback">
      <h1>${escapeHtml(h1)}</h1>
      <p>${escapeHtml(lead)}</p>
    </div>
    <script>
      (function () {
        var root = document.getElementById('root');
        var fallback = document.getElementById('seo-fallback');
        if (!root || !fallback) return;
        var done = false;
        function remove() {
          if (done) return;
          done = true;
          if (fallback.parentNode) fallback.parentNode.removeChild(fallback);
          observer.disconnect();
        }
        var observer = new MutationObserver(function () {
          if (root.childNodes.length > 0) remove();
        });
        observer.observe(root, { childList: true });
        setTimeout(remove, 10000);
      })();
    </script>`;
}

function renderPage(template, { locale, routePath, title, description, h1, lead, jsonLdBlocks }) {
  const fullTitle = title.endsWith(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;
  const canonicalUrl = `${SITE_URL}${localizedPath(locale, routePath)}`;

  let html = template;
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<link rel="canonical"[\s\S]*?\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  const headExtras = [buildHreflangLinks(routePath), buildJsonLdScripts(jsonLdBlocks ?? [])]
    .filter(Boolean)
    .join('\n    ');
  html = html.replace('</head>', `    ${headExtras}\n  </head>`);

  html = html.replace('<div id="root"></div>', `${renderSeoFallbackBlock(h1, lead)}\n    <div id="root"></div>`);

  return html;
}

function writePage(distRoutePath, html) {
  const outDir = path.join(distDir, ...distRoutePath.split('/').filter(Boolean));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

// --- main ---

if (!fs.existsSync(distDir)) {
  console.error(`dist/ not found at ${distDir} — run "vite build" before prerender-seo.mjs.`);
  process.exit(1);
}

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const hubs = JSON.parse(fs.readFileSync(path.join(publicDir, 'seo-hub-cities.json'), 'utf8'));
const popularDestinations = JSON.parse(
  fs.readFileSync(path.join(publicDir, 'seo-popular-destinations.json'), 'utf8')
);

let pageCount = 0;

// weekend-flights-from: all hubs x all locales.
for (const hub of hubs) {
  const slug = buildCitySlug(hub);
  const routePath = `/weekend-flights-from/${slug}`;
  for (const locale of LOCALES) {
    const vars = { city: hub.name };
    const html = renderPage(template, {
      locale,
      routePath,
      title: t(locale, 'meta.weekendFlightsFrom.title', vars),
      description: t(locale, 'meta.weekendFlightsFrom.description', vars),
      h1: t(locale, 'weekendFlightsFrom.title', vars),
      lead: t(locale, 'weekendFlightsFrom.lead', vars),
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'weekendFlightsFrom.tagline', vars),
            url: `${SITE_URL}${localizedPath(locale, routePath)}`
          }
        ]),
        faqPageJsonLd(t(locale, 'weekendFlightsFrom.faq', vars))
      ]
    });
    writePage(`${locale}${routePath}`, html);
    pageCount += 1;
  }
}

// day-trips-from: all hubs x all locales.
for (const hub of hubs) {
  const slug = buildCitySlug(hub);
  const routePath = `/day-trips-from/${slug}`;
  for (const locale of LOCALES) {
    const vars = { city: hub.name };
    const html = renderPage(template, {
      locale,
      routePath,
      title: t(locale, 'meta.dayTripsFrom.title', vars),
      description: t(locale, 'meta.dayTripsFrom.description', vars),
      h1: t(locale, 'dayTripsFrom.title', vars),
      lead: t(locale, 'dayTripsFrom.lead', vars),
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'dayTripsFrom.tagline', vars),
            url: `${SITE_URL}${localizedPath(locale, routePath)}`
          }
        ]),
        faqPageJsonLd(t(locale, 'dayTripsFrom.faq', vars))
      ]
    });
    writePage(`${locale}${routePath}`, html);
    pageCount += 1;
  }
}

// weekend-flights OD: capped hub x destination cross product, from != to (matches sitemap limits).
const odHubs = hubs.slice(0, OD_HUB_LIMIT);
const odDestinations = popularDestinations.slice(0, OD_DESTINATION_LIMIT);
for (const hub of odHubs) {
  for (const destination of odDestinations) {
    if (hub.code.toUpperCase() === destination.code.toUpperCase()) continue;
    const odSlug = `${buildCitySlug(hub)}-to-${buildCitySlug(destination)}`;
    const routePath = `/weekend-flights/${odSlug}`;
    for (const locale of OD_PRERENDER_LOCALES) {
      const vars = { from: hub.name, to: destination.name };
      const html = renderPage(template, {
        locale,
        routePath,
        title: t(locale, 'meta.weekendFlightsOd.title', vars),
        description: t(locale, 'meta.weekendFlightsOd.description', vars),
        h1: t(locale, 'weekendFlightsOd.title', vars),
        lead: t(locale, 'weekendFlightsOd.seoBlock', vars),
        jsonLdBlocks: [
          breadcrumbListJsonLd([
            { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
            {
              name: t(locale, 'weekendFlightsFrom.tagline', { city: hub.name }),
              url: `${SITE_URL}${localizedPath(locale, `/weekend-flights-from/${buildCitySlug(hub)}`)}`
            },
            {
              name: t(locale, 'weekendFlightsOd.title', vars),
              url: `${SITE_URL}${localizedPath(locale, routePath)}`
            }
          ])
        ]
      });
      writePage(`${locale}${routePath}`, html);
      pageCount += 1;
    }
  }
}

console.log(`prerender-seo: wrote ${pageCount} static HTML shells under dist/`);
