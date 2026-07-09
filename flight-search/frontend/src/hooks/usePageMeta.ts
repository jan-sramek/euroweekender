import { useEffect } from 'react';
import { LOCALE_CODES, localizedPath } from '../config/locales';
import { SITE_TITLE, SITE_URL } from '../config/site';
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

export function usePageMeta(title: string, description: string, routePath = '/') {
  const locale = useLocale();
  const fullTitle = title.endsWith(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;
  const canonicalUrl = `${SITE_URL}${localizedPath(locale, routePath)}`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertCanonical(canonicalUrl);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_TITLE);
    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    addHreflangLinks(routePath);

    return () => {
      clearHreflangLinks();
    };
  }, [canonicalUrl, description, fullTitle, routePath]);
}
