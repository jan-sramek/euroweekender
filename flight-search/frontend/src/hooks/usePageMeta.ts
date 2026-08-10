import { useEffect } from 'react';
import { LOCALE_CODES, localizedPath } from '../config/locales';
import { OG_IMAGE, SITE_TITLE, SITE_URL } from '../config/site';
import { useLocale } from './useLocale';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let element = document.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function clearHreflangLinks() {
  document.querySelectorAll('link[data-page-meta="hreflang"]').forEach(element => element.remove());
}

function addHreflangLinks(routePath: string) {
  clearHreflangLinks();

  for (const code of LOCALE_CODES) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = code;
    link.href = `${SITE_URL}${localizedPath(code, routePath)}`;
    link.setAttribute('data-page-meta', 'hreflang');
    document.head.appendChild(link);
  }

  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${SITE_URL}${localizedPath('en', routePath)}`;
  defaultLink.setAttribute('data-page-meta', 'hreflang');
  document.head.appendChild(defaultLink);
}

export type PageMetaOptions = {
  /** Tell crawlers not to index this URL (404s, etc.). */
  noindex?: boolean;
};

function clearRobotsMeta() {
  document.querySelectorAll('meta[name="robots"]').forEach(element => element.remove());
}

export function usePageMeta(
  title: string,
  description: string,
  routePath = '/',
  options: PageMetaOptions = {}
) {
  const locale = useLocale();
  const fullTitle = title.endsWith(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;
  const canonicalUrl = `${SITE_URL}${localizedPath(locale, routePath)}`;
  const noindex = options.noindex === true;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', OG_IMAGE);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_TITLE);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', OG_IMAGE);

    if (noindex) {
      upsertMeta('name', 'robots', 'noindex, follow');
      // Avoid inventing a canonical / hreflang graph for missing URLs.
      document.querySelector('link[rel="canonical"]')?.remove();
      clearHreflangLinks();
      document.querySelector('meta[property="og:url"]')?.remove();
    } else {
      clearRobotsMeta();
      upsertCanonical(canonicalUrl);
      upsertMeta('property', 'og:url', canonicalUrl);
      addHreflangLinks(routePath);
    }

    return () => {
      clearHreflangLinks();
      if (noindex) clearRobotsMeta();
    };
  }, [canonicalUrl, description, fullTitle, noindex, routePath]);
}
