export const SEO_PAGE_TYPES = {
  weekendFrom: 'weekend-from',
  dayTripsFrom: 'day-trips-from',
  weekendOd: 'weekend-od'
} as const;

export type SeoPageType = (typeof SEO_PAGE_TYPES)[keyof typeof SEO_PAGE_TYPES];

export interface SeoFaqItem {
  q: string;
  a: string;
}

export interface SeoPageContent {
  pageType: string;
  originCode: string;
  destinationCode: string;
  locale: string;
  lead: string;
  heading: string;
  metaDescription: string;
  paragraphs: string[];
  faq: SeoFaqItem[];
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  generatedAt?: string;
}

export function seoContentKey(
  pageType: string,
  origin: string | null | undefined,
  destination: string | null | undefined,
  locale: string
): string {
  const type = pageType.trim().toLowerCase();
  const from = (origin ?? '').trim().toUpperCase();
  const to = (destination ?? '').trim().toUpperCase();
  const lang = locale.trim().toLowerCase();
  return to ? `${type}:${from}:${to}:${lang}` : `${type}:${from}:${lang}`;
}

export function isUsableSeoPageContent(content: SeoPageContent | null | undefined): content is SeoPageContent {
  return Boolean(content && Array.isArray(content.paragraphs) && content.paragraphs.length > 0);
}
