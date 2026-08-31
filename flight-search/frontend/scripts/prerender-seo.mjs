/**
 * Post-build step: writes static, crawlable HTML shells for SEO-critical routes by
 * cloning dist/index.html, patching <head>, and injecting a visible SEO fallback body.
 *
 * Covers: locale homes, tool pages, content pages, and programmatic city/OD landings.
 * Intentionally lightweight (no headless browser): the SPA still boots and removes
 * #seo-fallback once React fills #root.
 *
 * Run after `vite build`: node scripts/prerender-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCALES, STATIC_INDEXABLE_LOCALES } from '../../../scripts/seo-locales.mjs';
import { indexableLocalesForHub, preferredIndexableLocaleForHub } from '../../../scripts/seo-city-locales.mjs';
import { lookupSeoPageContent, SEO_PAGE_TYPES } from '../../../scripts/seo-page-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..');
const distDir = path.join(frontendDir, 'dist');
const publicDir = path.join(frontendDir, 'public');
const localesDir = path.join(frontendDir, 'src', 'locales');

const SITE_URL = 'https://euroweekender.com';
const SITE_TITLE = 'euroweekender.com';
const CONTACT_EMAIL = 'hello@euroweekender.com';
/** Default Open Graph image (1200-ish Unsplash hero used on the homepage). */
const OG_IMAGE =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80';

// Keep in sync with scripts/generate-seo-sitemap.mjs at the repo root.
const OD_HUB_LIMIT = 40;
const OD_DESTINATION_LIMIT = 12;
const HUB_LINK_LIMIT = 12;
const DEST_LINK_LIMIT = 12;

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

// Keep in sync with src/utils/geo.ts + src/utils/routeFacts.ts
const EARTH_RADIUS_KM = 6371;
const CRUISE_KMH = 780;
const BLOCK_OVERHEAD_MINUTES = 40;
const MIN_DURATION_MINUTES = 45;

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

function hopRangeFromDestinations(coords, fromCode, destinations) {
  const minutes = [];
  for (const dest of destinations) {
    const facts = computeRouteFacts(coords, fromCode, dest.code);
    if (facts) minutes.push(facts.durationMinutes);
  }
  if (minutes.length === 0) return null;
  const minMinutes = Math.min(...minutes);
  const maxMinutes = Math.max(...minutes);
  return {
    minMinutes,
    maxMinutes,
    minDurationLabel: formatDurationLabel(minMinutes),
    maxDurationLabel: formatDurationLabel(maxMinutes)
  };
}

// --- HTML helpers ---

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHreflangLinks(routePath, locales = STATIC_INDEXABLE_LOCALES) {
  const links = locales.map(
    code => `<link rel="alternate" hreflang="${code}" href="${SITE_URL}${localizedPath(code, routePath)}" />`
  );
  links.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath('en', routePath)}" />`);
  return links.join('\n    ');
}

function buildJsonLdScripts(jsonLdBlocks) {
  return jsonLdBlocks
    .filter(Boolean)
    .map(data => {
      const type = data['@type'] || 'page';
      return `<script type="application/ld+json" data-json-ld="${escapeHtml(type)}">${JSON.stringify(data)}</script>`;
    })
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

function websiteJsonLd(locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_TITLE,
    url: `${SITE_URL}${localizedPath(locale, '/')}`,
    inLanguage: locale,
    description: t(locale, 'meta.home.description')
  };
}

function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_TITLE,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-icon.png`,
    email: CONTACT_EMAIL
  };
}

function renderParagraphs(paragraphs = []) {
  return paragraphs
    .filter(Boolean)
    .map(text => `      <p>${escapeHtml(text)}</p>`)
    .join('\n');
}

function renderFaqHtml(faqTitle, items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const title = faqTitle ? `      <h2>${escapeHtml(faqTitle)}</h2>\n` : '';
  const body = items
    .map(
      item => `      <section>
        <h3>${escapeHtml(item.q)}</h3>
        <p>${escapeHtml(item.a)}</p>
      </section>`
    )
    .join('\n');
  return `${title}${body}`;
}

function renderLinkGroup(title, links) {
  if (!Array.isArray(links) || links.length === 0) return '';
  const items = links
    .map(link => `        <li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('\n');
  return `      <nav aria-label="${escapeHtml(title)}">
        <h2>${escapeHtml(title)}</h2>
        <ul>
${items}
        </ul>
      </nav>`;
}

function destinationLinks(locale, fromHub, destinations, { limit = DEST_LINK_LIMIT } = {}) {
  const links = destinations
    .filter(dest => dest.code && dest.code.toUpperCase() !== fromHub.code.toUpperCase())
    .slice(0, limit)
    .map(dest => {
      const name = dest.name || dest.code;
      const label =
        dest.minPrice > 0
          ? `${name} · ${t(locale, 'weekendFlightsFrom.destinationPrice', {
              price: Math.round(dest.minPrice)
            })}`
          : name;
      return {
        href: `${SITE_URL}${localizedPath(
          preferredIndexableLocaleForHub(locale, fromHub),
          `/weekend-flights/${buildCitySlug(fromHub)}-to-${buildCitySlug({
            code: dest.code,
            name
          })}`
        )}`,
        label
      };
    });

  return renderLinkGroup(t(locale, 'weekendFlightsFrom.topDestinationsTitle', { city: fromHub.name }), links);
}

function hubLinks(
  locale,
  hubs,
  { excludeCode, variant = 'weekend', limit = HUB_LINK_LIMIT, dealSnapshot = null } = {}
) {
  const excluded = excludeCode?.trim().toUpperCase();
  const titleKey =
    variant === 'dayTrips' ? 'dayTripsFrom.popularHubsTitle' : 'weekendFlightsFrom.popularHubsTitle';
  const labelKey = variant === 'dayTrips' ? 'dayTripsFrom.tagline' : 'weekendFlightsFrom.tagline';
  const pathPrefix = variant === 'dayTrips' ? '/day-trips-from' : '/weekend-flights-from';

  const links = hubs
    .filter(hub => hub.code.toUpperCase() !== excluded)
    .slice(0, limit)
    .map(hub => {
      const base = t(locale, labelKey, { city: hub.name });
      const deal = dealSnapshot?.hubs?.[hub.code.toUpperCase()];
      const label =
        variant === 'weekend' && deal && deal.minPrice > 0
          ? `${base} · ${t(locale, 'weekendFlightsFrom.destinationPrice', {
              price: Math.round(deal.minPrice)
            })}`
          : base;
      return {
        href: `${SITE_URL}${localizedPath(
          preferredIndexableLocaleForHub(locale, hub),
          `${pathPrefix}/${buildCitySlug(hub)}`
        )}`,
        label
      };
    });

  return renderLinkGroup(t(locale, titleKey), links);
}

function toolLinks(locale) {
  return renderLinkGroup(t(locale, 'footer.explore'), [
    {
      href: `${SITE_URL}${localizedPath(locale, '/cheapest-weekend')}`,
      label: t(locale, 'nav.cheapestWeekend')
    },
    {
      href: `${SITE_URL}${localizedPath(locale, '/single-day-trips')}`,
      label: t(locale, 'nav.singleDayTrips')
    },
    {
      href: `${SITE_URL}${localizedPath(locale, '/how-it-works')}`,
      label: t(locale, 'nav.howItWorks')
    },
    {
      href: `${SITE_URL}${localizedPath(locale, '/faq')}`,
      label: t(locale, 'nav.faq')
    }
  ]);
}

/** Curated OD pairs for homepage internal linking (keep in sync with src/data/seoPopularRoutes.ts). */
const POPULAR_ROUTE_CODES = [
  ['PRG', 'ROM'],
  ['PRG', 'BCN'],
  ['PRG', 'LON'],
  ['PRG', 'MIL'],
  ['PRG', 'PAR'],
  ['VIE', 'ROM'],
  ['VIE', 'BCN'],
  ['VIE', 'LON'],
  ['VIE', 'MIL'],
  ['BER', 'LON'],
  ['BER', 'ROM'],
  ['BER', 'BCN'],
  ['BER', 'AMS'],
  ['MUC', 'ROM'],
  ['MUC', 'BCN'],
  ['MUC', 'LON'],
  ['LON', 'BCN'],
  ['LON', 'ROM'],
  ['LON', 'AMS'],
  ['LON', 'PAR'],
  ['AMS', 'BCN'],
  ['AMS', 'ROM'],
  ['BCN', 'ROM'],
  ['BCN', 'LON']
];

function cityByCode(hubs, destinations, code) {
  const upper = code.toUpperCase();
  return (
    hubs.find(city => city.code.toUpperCase() === upper) ||
    destinations.find(city => city.code.toUpperCase() === upper)
  );
}

function hubDeal(snapshot, code) {
  return snapshot?.hubs?.[String(code).trim().toUpperCase()] ?? null;
}

function originDestinations(snapshot, code, fallback = []) {
  const live = snapshot?.destinationsByOrigin?.[String(code).trim().toUpperCase()];
  if (Array.isArray(live) && live.length > 0) return live;
  return fallback;
}

function odMinPrice(snapshot, fromCode, toCode) {
  const list = originDestinations(snapshot, fromCode, []);
  const match = list.find(dest => dest.code.toUpperCase() === String(toCode).trim().toUpperCase());
  return match && match.minPrice > 0 ? match.minPrice : null;
}

function popularRouteLinks(locale, hubs, destinations, dealSnapshot = null) {
  const links = POPULAR_ROUTE_CODES.flatMap(([fromCode, toCode]) => {
    const from = cityByCode(hubs, destinations, fromCode);
    const to = cityByCode(hubs, destinations, toCode);
    if (!from || !to || from.code.toUpperCase() === to.code.toUpperCase()) return [];
    const minPrice = odMinPrice(dealSnapshot, fromCode, toCode);
    const base = t(locale, 'home.popularRouteLabel', { from: from.name, to: to.name });
    const label =
      minPrice != null
        ? `${base} · ${t(locale, 'weekendFlightsFrom.destinationPrice', {
            price: Math.round(minPrice)
          })}`
        : base;
    return [
      {
        href: `${SITE_URL}${localizedPath(
          preferredIndexableLocaleForHub(locale, from),
          `/weekend-flights/${buildCitySlug(from)}-to-${buildCitySlug(to)}`
        )}`,
        label
      }
    ];
  });
  return renderLinkGroup(t(locale, 'home.popularRoutesTitle'), links);
}

function howItWorksHtml(locale) {
  const steps = [1, 2, 3, 4]
    .map(
      n =>
        `        <li><strong>${escapeHtml(t(locale, `howItWorks.step${n}title`))}</strong> — ${escapeHtml(
          t(locale, `howItWorks.step${n}text`)
        )}</li>`
    )
    .join('\n');
  return `      <h2>${escapeHtml(t(locale, 'home.howItWorksTitle'))}</h2>
      <ol>
${steps}
      </ol>`;
}

function renderSeoFallbackBlock({ h1, lead, paragraphs = [], faqTitle, faqItems, linkGroupsHtml = [] }) {
  const parts = [
    `      <h1>${escapeHtml(h1)}</h1>`,
    lead ? `      <p>${escapeHtml(lead)}</p>` : '',
    renderParagraphs(paragraphs),
    ...linkGroupsHtml.filter(Boolean),
    renderFaqHtml(faqTitle, faqItems)
  ].filter(Boolean);

  // Visually hide the crawlable fallback so users don't flash duplicate content;
  // React removes #seo-fallback once #root has children. Crawlers still see the HTML.
  return `<style>
      #seo-fallback{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    </style>
    <div id="seo-fallback">
${parts.join('\n')}
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

function upsertMeta(html, attr, key, content) {
  const pattern = new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function renderPage(
  template,
  {
    locale,
    routePath,
    title,
    description,
    h1,
    lead,
    paragraphs,
    faqTitle,
    faqItems,
    linkGroupsHtml,
    jsonLdBlocks,
    ogImage = OG_IMAGE,
    indexLocales = STATIC_INDEXABLE_LOCALES
  }
) {
  const fullTitle = title.endsWith(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;
  const canonicalUrl = `${SITE_URL}${localizedPath(locale, routePath)}`;
  const noindex = !indexLocales.includes(locale);

  let html = template;
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${locale}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  // Drop bootstrap hreflang so we emit a single consistent set (or none when noindex).
  html = html.replace(/\s*<link rel="alternate"[^>]*hreflang="[^"]*"[^>]*\/?>/gi, '');
  html = upsertMeta(html, 'property', 'og:title', fullTitle);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:image', ogImage);
  html = upsertMeta(html, 'name', 'twitter:title', fullTitle);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:image', ogImage);
  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');

  if (noindex) {
    html = upsertMeta(html, 'name', 'robots', 'noindex, follow');
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>\n?/, '');
    html = html.replace(/\s*<meta property="og:url"[^>]*>/, '');
  } else {
    html = html.replace(
      /<link rel="canonical"[\s\S]*?\/>/,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );
    html = upsertMeta(html, 'property', 'og:url', canonicalUrl);
  }

  const headExtras = [
    noindex ? '' : buildHreflangLinks(routePath, indexLocales),
    buildJsonLdScripts(jsonLdBlocks ?? [])
  ]
    .filter(Boolean)
    .join('\n    ');
  html = html.replace('</head>', `    ${headExtras}\n  </head>`);

  const fallback = renderSeoFallbackBlock({
    h1,
    lead,
    paragraphs,
    faqTitle,
    faqItems,
    linkGroupsHtml
  });
  html = html.replace('<div id="root"></div>', `${fallback}\n    <div id="root"></div>`);

  return html;
}

function writePage(distRoutePath, html) {
  const outDir = path.join(distDir, ...distRoutePath.split('/').filter(Boolean));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

function writeStaticRoute(template, locale, routePath, options) {
  const html = renderPage(template, { locale, routePath, ...options });
  writePage(`${locale}${routePath === '/' ? '' : routePath}`, html);
}

// --- main ---

async function main() {
  if (!fs.existsSync(distDir)) {
    console.error(`dist/ not found at ${distDir} — run "vite build" before prerender-seo.mjs.`);
    process.exit(1);
  }

  const { loadSeoDealSnapshot } = await import('./fetch-seo-deal-snapshot.mjs');
  const dealSnapshot = await loadSeoDealSnapshot();

  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const hubs = JSON.parse(fs.readFileSync(path.join(publicDir, 'seo-hub-cities.json'), 'utf8'));
  const popularDestinations = JSON.parse(
    fs.readFileSync(path.join(publicDir, 'seo-popular-destinations.json'), 'utf8')
  );
  const cityCoords = JSON.parse(fs.readFileSync(path.join(publicDir, 'seo-city-coords.json'), 'utf8'));
  const pageContentPath = path.join(publicDir, 'seo-page-content.json');
  const pageContentSnapshot = fs.existsSync(pageContentPath)
    ? JSON.parse(fs.readFileSync(pageContentPath, 'utf8'))
    : { pages: {} };

  let pageCount = 0;

  // Locale homes + marketing / tool / content pages (previously fell through to root index.html).
  for (const locale of LOCALES) {
    const emailVars = { email: CONTACT_EMAIL };

    const homeFaqItems = Array.isArray(t(locale, 'faq.items')) ? t(locale, 'faq.items').slice(0, 3) : [];
    writeStaticRoute(template, locale, '/', {
      title: t(locale, 'meta.home.title'),
      description: t(locale, 'meta.home.description'),
      h1: t(locale, 'home.title'),
      lead: t(locale, 'home.lead'),
      paragraphs: [t(locale, 'home.seoBlock')],
      faqTitle: t(locale, 'home.faqTeaserTitle'),
      faqItems: homeFaqItems,
      linkGroupsHtml: [
        toolLinks(locale),
        hubLinks(locale, hubs, { dealSnapshot }),
        popularRouteLinks(locale, hubs, popularDestinations, dealSnapshot),
        howItWorksHtml(locale)
      ],
      jsonLdBlocks: [websiteJsonLd(locale), organizationJsonLd(), faqPageJsonLd(homeFaqItems)]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/cheapest-weekend', {
      title: t(locale, 'meta.cheapestWeekend.title'),
      description: t(locale, 'meta.cheapestWeekend.description'),
      h1: t(locale, 'cheapestWeekend.title'),
      lead: t(locale, 'cheapestWeekend.lead'),
      paragraphs: [t(locale, 'cheapestWeekend.seoBlock')],
      linkGroupsHtml: [toolLinks(locale), hubLinks(locale, hubs, { dealSnapshot })],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'nav.cheapestWeekend'),
            url: `${SITE_URL}${localizedPath(locale, '/cheapest-weekend')}`
          }
        ])
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/single-day-trips', {
      title: t(locale, 'meta.singleDayTrips.title'),
      description: t(locale, 'meta.singleDayTrips.description'),
      h1: t(locale, 'singleDayTrips.title'),
      lead: t(locale, 'singleDayTrips.lead'),
      paragraphs: [t(locale, 'singleDayTrips.seoBlock')],
      linkGroupsHtml: [toolLinks(locale), hubLinks(locale, hubs, { variant: 'dayTrips' })],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'nav.singleDayTrips'),
            url: `${SITE_URL}${localizedPath(locale, '/single-day-trips')}`
          }
        ])
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/about', {
      title: t(locale, 'meta.about.title'),
      description: t(locale, 'meta.about.description'),
      h1: t(locale, 'about.heroTitle'),
      lead: t(locale, 'about.lead'),
      paragraphs: [
        t(locale, 'about.sections.weekendP1'),
        t(locale, 'about.sections.whatP'),
        t(locale, 'about.sections.whoP')
      ],
      linkGroupsHtml: [toolLinks(locale)],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          { name: t(locale, 'nav.about'), url: `${SITE_URL}${localizedPath(locale, '/about')}` }
        ]),
        organizationJsonLd()
      ]
    });
    pageCount += 1;

    const faqItems = t(locale, 'faq.items');
    writeStaticRoute(template, locale, '/faq', {
      title: t(locale, 'meta.faq.title'),
      description: t(locale, 'meta.faq.description'),
      h1: t(locale, 'faq.heroTitle'),
      lead: t(locale, 'faq.lead'),
      faqItems: Array.isArray(faqItems) ? faqItems : [],
      linkGroupsHtml: [toolLinks(locale)],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          { name: t(locale, 'nav.faq'), url: `${SITE_URL}${localizedPath(locale, '/faq')}` }
        ]),
        faqPageJsonLd(faqItems)
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/how-it-works', {
      title: t(locale, 'meta.howItWorks.title'),
      description: t(locale, 'meta.howItWorks.description'),
      h1: t(locale, 'howItWorks.heroTitle'),
      lead: t(locale, 'howItWorks.lead'),
      paragraphs: [
        t(locale, 'howItWorks.builtP1'),
        `${t(locale, 'howItWorks.step1title')}: ${t(locale, 'howItWorks.step1text')}`,
        `${t(locale, 'howItWorks.step2title')}: ${t(locale, 'howItWorks.step2text')}`,
        `${t(locale, 'howItWorks.step3title')}: ${t(locale, 'howItWorks.step3text')}`,
        `${t(locale, 'howItWorks.step4title')}: ${t(locale, 'howItWorks.step4text')}`
      ],
      linkGroupsHtml: [toolLinks(locale)],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'nav.howItWorks'),
            url: `${SITE_URL}${localizedPath(locale, '/how-it-works')}`
          }
        ])
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/contact', {
      title: t(locale, 'meta.contact.title'),
      description: t(locale, 'meta.contact.description'),
      h1: t(locale, 'contact.heroTitle'),
      lead: t(locale, 'contact.lead'),
      paragraphs: [t(locale, 'contact.emailBody'), CONTACT_EMAIL],
      linkGroupsHtml: [toolLinks(locale)],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          { name: t(locale, 'nav.contact'), url: `${SITE_URL}${localizedPath(locale, '/contact')}` }
        ])
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/privacy', {
      title: t(locale, 'meta.privacy.title'),
      description: t(locale, 'meta.privacy.description'),
      h1: t(locale, 'privacy.title'),
      lead: t(locale, 'privacy.lead'),
      paragraphs: [
        t(locale, 'privacy.intro'),
        t(locale, 'privacy.analytics'),
        t(locale, 'privacy.location'),
        t(locale, 'privacy.contact', emailVars)
      ],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          {
            name: t(locale, 'footer.privacy'),
            url: `${SITE_URL}${localizedPath(locale, '/privacy')}`
          }
        ])
      ]
    });
    pageCount += 1;

    writeStaticRoute(template, locale, '/terms', {
      title: t(locale, 'meta.terms.title'),
      description: t(locale, 'meta.terms.description'),
      h1: t(locale, 'terms.title'),
      lead: t(locale, 'terms.lead'),
      paragraphs: [
        t(locale, 'terms.intro'),
        t(locale, 'terms.service'),
        t(locale, 'terms.accuracy'),
        t(locale, 'terms.contact', emailVars)
      ],
      jsonLdBlocks: [
        breadcrumbListJsonLd([
          { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
          { name: t(locale, 'footer.terms'), url: `${SITE_URL}${localizedPath(locale, '/terms')}` }
        ])
      ]
    });
    pageCount += 1;
  }

  // weekend-flights-from: all hubs × all UI locales (non-local languages are noindex).
  for (const hub of hubs) {
    const slug = buildCitySlug(hub);
    const routePath = `/weekend-flights-from/${slug}`;
    const deal = hubDeal(dealSnapshot, hub.code);
    const dests = originDestinations(dealSnapshot, hub.code, popularDestinations);
    const indexLocales = indexableLocalesForHub(hub);

    for (const locale of LOCALES) {
      const vars = { city: hub.name };
      const unique = lookupSeoPageContent(
        pageContentSnapshot,
        SEO_PAGE_TYPES.weekendFrom,
        hub.code,
        '',
        locale
      );
      const faqItems = unique?.faq?.length ? unique.faq : t(locale, 'weekendFlightsFrom.faq', vars);
      const paragraphs = unique?.paragraphs?.length
        ? [...unique.paragraphs]
        : [t(locale, 'weekendFlightsFrom.seoBlock', vars)];
      if (deal && deal.minPrice > 0 && deal.destinationCount > 0) {
        paragraphs.unshift(
          t(locale, 'weekendFlightsFrom.priceHint', {
            city: hub.name,
            minPrice: Math.round(deal.minPrice),
            destinationCount: deal.destinationCount
          })
        );
      }
      const hops = hopRangeFromDestinations(cityCoords, hub.code, dests);
      if (hops) {
        paragraphs.push(
          hops.minMinutes === hops.maxMinutes
            ? t(locale, 'weekendFlightsFrom.hopHintSingle', {
                city: hub.name,
                duration: hops.minDurationLabel
              })
            : t(locale, 'weekendFlightsFrom.hopHintRange', {
                city: hub.name,
                durationMin: hops.minDurationLabel,
                durationMax: hops.maxDurationLabel
              })
        );
      }

      const html = renderPage(template, {
        locale,
        routePath,
        title: t(locale, 'meta.weekendFlightsFrom.title', vars),
        description: unique?.metaDescription || t(locale, 'meta.weekendFlightsFrom.description', vars),
        h1: t(locale, 'weekendFlightsFrom.title', vars),
        lead: unique?.lead || t(locale, 'weekendFlightsFrom.lead', vars),
        paragraphs,
        faqTitle: t(locale, 'weekendFlightsFrom.faqTitle', vars),
        faqItems: Array.isArray(faqItems) ? faqItems : [],
        indexLocales,
        linkGroupsHtml: [
          destinationLinks(locale, hub, dests),
          hubLinks(locale, hubs, { excludeCode: hub.code, dealSnapshot }),
          renderLinkGroup(t(locale, 'footer.explore'), [
            {
              href: `${SITE_URL}${localizedPath(
                preferredIndexableLocaleForHub(locale, hub),
                `/day-trips-from/${slug}`
              )}`,
              label: t(locale, 'weekendFlightsFrom.seeAlsoDayTripsFromCity', vars)
            },
            {
              href: `${SITE_URL}${localizedPath(locale, '/cheapest-weekend')}`,
              label: t(locale, 'weekendFlightsFrom.seeAlsoCheapest')
            }
          ])
        ],
        jsonLdBlocks: [
          breadcrumbListJsonLd([
            { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
            {
              name: t(locale, 'weekendFlightsFrom.tagline', vars),
              url: `${SITE_URL}${localizedPath(locale, routePath)}`
            }
          ]),
          faqPageJsonLd(faqItems)
        ]
      });
      writePage(`${locale}${routePath}`, html);
      pageCount += 1;
    }
  }

  // day-trips-from: all hubs × all UI locales (non-local languages are noindex).
  for (const hub of hubs) {
    const slug = buildCitySlug(hub);
    const routePath = `/day-trips-from/${slug}`;
    const indexLocales = indexableLocalesForHub(hub);
    for (const locale of LOCALES) {
      const vars = { city: hub.name };
      const unique = lookupSeoPageContent(
        pageContentSnapshot,
        SEO_PAGE_TYPES.dayTripsFrom,
        hub.code,
        '',
        locale
      );
      const faqItems = unique?.faq?.length ? unique.faq : t(locale, 'dayTripsFrom.faq', vars);
      const html = renderPage(template, {
        locale,
        routePath,
        title: t(locale, 'meta.dayTripsFrom.title', vars),
        description: unique?.metaDescription || t(locale, 'meta.dayTripsFrom.description', vars),
        h1: t(locale, 'dayTripsFrom.title', vars),
        lead: unique?.lead || t(locale, 'dayTripsFrom.lead', vars),
        paragraphs: unique?.paragraphs?.length
          ? unique.paragraphs
          : [t(locale, 'dayTripsFrom.seoBlock', vars)],
        faqTitle: t(locale, 'dayTripsFrom.faqTitle', vars),
        faqItems: Array.isArray(faqItems) ? faqItems : [],
        indexLocales,
        linkGroupsHtml: [
          hubLinks(locale, hubs, { excludeCode: hub.code, variant: 'dayTrips' }),
          renderLinkGroup(t(locale, 'footer.explore'), [
            {
              href: `${SITE_URL}${localizedPath(
                preferredIndexableLocaleForHub(locale, hub),
                `/weekend-flights-from/${slug}`
              )}`,
              label: t(locale, 'dayTripsFrom.seeAlsoWeekendFromCity', vars)
            },
            {
              href: `${SITE_URL}${localizedPath(locale, '/single-day-trips')}`,
              label: t(locale, 'nav.singleDayTrips')
            }
          ])
        ],
        jsonLdBlocks: [
          breadcrumbListJsonLd([
            { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
            {
              name: t(locale, 'dayTripsFrom.tagline', vars),
              url: `${SITE_URL}${localizedPath(locale, routePath)}`
            }
          ]),
          faqPageJsonLd(faqItems)
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
      const routeMin = odMinPrice(dealSnapshot, hub.code, destination.code);
      const dests = originDestinations(dealSnapshot, hub.code, popularDestinations);

      const indexLocales = indexableLocalesForHub(hub);
      for (const locale of LOCALES) {
        const facts = computeRouteFacts(cityCoords, hub.code, destination.code);
        const vars = {
          from: hub.name,
          to: destination.name,
          duration: facts?.durationLabel ?? '',
          distanceKm: facts?.distanceKm ?? ''
        };
        const paragraphs = [];
        const unique = lookupSeoPageContent(
          pageContentSnapshot,
          SEO_PAGE_TYPES.weekendOd,
          hub.code,
          destination.code,
          locale
        );
        if (unique?.paragraphs?.length) {
          paragraphs.push(...unique.paragraphs);
        } else {
          if (routeMin != null) {
            paragraphs.push(
              t(locale, 'weekendFlightsOd.priceHint', {
                from: hub.name,
                to: destination.name,
                minPrice: Math.round(routeMin)
              })
            );
          }
          if (facts) {
            paragraphs.push(t(locale, 'weekendFlightsOd.durationHint', vars));
            paragraphs.push(t(locale, 'weekendFlightsOd.weekendPatternHint', vars));
          }
        }
        const faqItems = unique?.faq?.length ? unique.faq : t(locale, 'weekendFlightsOd.faq', vars);

        const html = renderPage(template, {
          locale,
          routePath,
          title: t(locale, 'meta.weekendFlightsOd.title', vars),
          description: unique?.metaDescription || t(locale, 'meta.weekendFlightsOd.description', vars),
          h1: t(locale, 'weekendFlightsOd.title', vars),
          lead: unique?.lead || t(locale, 'weekendFlightsOd.lead', vars),
          paragraphs,
          faqTitle: t(locale, 'weekendFlightsOd.faqTitle', vars),
          faqItems: Array.isArray(faqItems) ? faqItems : [],
          indexLocales,
          linkGroupsHtml: [
            renderLinkGroup(t(locale, 'footer.explore'), [
              {
                href: `${SITE_URL}${localizedPath(
                  preferredIndexableLocaleForHub(locale, hub),
                  `/weekend-flights-from/${buildCitySlug(hub)}`
                )}`,
                label: t(locale, 'weekendFlightsOd.seeAlsoFromCity', { city: hub.name })
              },
              {
                href: `${SITE_URL}${localizedPath(
                  preferredIndexableLocaleForHub(
                    locale,
                    cityByCode(hubs, popularDestinations, destination.code) || destination
                  ),
                  `/weekend-flights-from/${buildCitySlug(destination)}`
                )}`,
                label: t(locale, 'weekendFlightsOd.seeAlsoFromCity', { city: destination.name })
              },
              {
                href: `${SITE_URL}${localizedPath(
                  preferredIndexableLocaleForHub(locale, hub),
                  `/day-trips-from/${buildCitySlug(hub)}`
                )}`,
                label: t(locale, 'weekendFlightsFrom.seeAlsoDayTripsFromCity', { city: hub.name })
              },
              {
                href: `${SITE_URL}${localizedPath(locale, '/cheapest-weekend')}`,
                label: t(locale, 'weekendFlightsFrom.seeAlsoCheapest')
              }
            ]),
            destinationLinks(locale, hub, dests)
          ],
          jsonLdBlocks: [
            breadcrumbListJsonLd([
              { name: t(locale, 'nav.home'), url: `${SITE_URL}${localizedPath(locale, '/')}` },
              {
                name: t(locale, 'weekendFlightsFrom.tagline', { city: hub.name }),
                url: `${SITE_URL}${localizedPath(
                  preferredIndexableLocaleForHub(locale, hub),
                  `/weekend-flights-from/${buildCitySlug(hub)}`
                )}`
              },
              {
                name: t(locale, 'weekendFlightsOd.title', vars),
                url: `${SITE_URL}${localizedPath(locale, routePath)}`
              }
            ]),
            faqPageJsonLd(faqItems)
          ]
        });
        writePage(`${locale}${routePath}`, html);
        pageCount += 1;
      }
    }
  }

  console.log(`prerender-seo: wrote ${pageCount} static HTML shells under dist/`);
  if (dealSnapshot.fetchedAt) {
    console.log(`prerender-seo: deal snapshot from ${dealSnapshot.fetchedAt}`);
  }
  if (pageContentSnapshot.pageCount) {
    console.log(`prerender-seo: unique page copy for ${pageContentSnapshot.pageCount} landings`);
  }

  // SPA 404 body: nginx serves this with HTTP 404 for unknown paths (see nginx.conf).
  {
    const notFoundTitle = `${t('en', 'meta.notFound.title')} | ${SITE_TITLE}`;
    const notFoundDescription = t('en', 'meta.notFound.description');
    let notFoundHtml = template;
    notFoundHtml = notFoundHtml.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(notFoundTitle)}</title>`
    );
    notFoundHtml = upsertMeta(notFoundHtml, 'name', 'description', notFoundDescription);
    notFoundHtml = upsertMeta(notFoundHtml, 'name', 'robots', 'noindex, follow');
    notFoundHtml = upsertMeta(notFoundHtml, 'property', 'og:title', notFoundTitle);
    notFoundHtml = upsertMeta(notFoundHtml, 'property', 'og:description', notFoundDescription);
    notFoundHtml = notFoundHtml.replace(/<link rel="canonical"[\s\S]*?\/>\n?/, '');
    const notFoundFallback = renderSeoFallbackBlock({
      h1: t('en', 'notFound.title'),
      lead: t('en', 'notFound.lead'),
      linkGroupsHtml: [
        renderLinkGroup(t('en', 'footer.explore'), [
          { href: `${SITE_URL}/en`, label: t('en', 'notFound.backHome') }
        ])
      ]
    });
    notFoundHtml = notFoundHtml.replace(
      '<div id="root"></div>',
      `${notFoundFallback}\n    <div id="root"></div>`
    );
    fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml);
    console.log('prerender-seo: wrote dist/404.html (HTTP 404 body)');
  }
}

main().catch(error => {
  console.error('prerender-seo failed:', error);
  process.exit(1);
});
