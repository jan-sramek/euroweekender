import { useEffect } from 'react';
import { SITE_TITLE } from '../config/site';

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title.endsWith(SITE_TITLE) ? title : `${title} | ${SITE_TITLE}`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [title, description]);
}
