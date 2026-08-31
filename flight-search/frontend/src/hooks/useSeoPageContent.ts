import { useEffect, useState } from 'react';
import { getSeoPageContent } from '../services/api';
import {
  isUsableSeoPageContent,
  type SeoPageContent,
  type SeoPageType
} from '../utils/seoPageContent';

export function useSeoPageContent(
  pageType: SeoPageType,
  originCode: string | null | undefined,
  destinationCode: string | null | undefined,
  locale: string
): SeoPageContent | null {
  const [content, setContent] = useState<SeoPageContent | null>(null);

  useEffect(() => {
    if (!originCode) {
      setContent(null);
      return;
    }

    let cancelled = false;
    void getSeoPageContent(pageType, originCode, destinationCode, locale).then(
      next => {
        if (!cancelled) setContent(isUsableSeoPageContent(next) ? next : null);
      },
      () => {
        if (!cancelled) setContent(null);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [pageType, originCode, destinationCode, locale]);

  return content;
}
