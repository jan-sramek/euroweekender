import { SITE_URL } from '../config/site';

export interface BreadcrumbItem {
  name: string;
  /** Localized route path (e.g. from useLocalizedPath().path(...)) or an absolute URL. */
  path: string;
}

/** BreadcrumbList structured data. Pass already-localized paths (or absolute URLs). */
export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path.startsWith('http') ? item.path : `${SITE_URL}${item.path}`
    }))
  };
}

export interface FaqSchemaItem {
  q: string;
  a: string;
}

/** FAQPage structured data (same shape used on the FAQ page). */
export function faqPageJsonLd(items: FaqSchemaItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a
      }
    }))
  };
}
