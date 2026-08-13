import { useEffect } from 'react';

function jsonLdType(data: object): string {
  const type = (data as { '@type'?: unknown })['@type'];
  return typeof type === 'string' && type.length > 0 ? type : 'page';
}

function removeJsonLdScripts(type: string) {
  document.querySelectorAll('script[type="application/ld+json"]').forEach(element => {
    if (element.getAttribute('data-json-ld') === type) {
      element.remove();
      return;
    }
    try {
      const parsed = JSON.parse(element.textContent || '') as { '@type'?: string };
      if (parsed['@type'] === type) element.remove();
    } catch {
      /* ignore malformed blocks */
    }
  });
}

/** Injects a single application/ld+json script into <head> and removes it on cleanup/change. */
export function useJsonLd(data: object | null | undefined): void {
  const serialized = data ? JSON.stringify(data) : null;
  const type = data ? jsonLdType(data) : null;

  useEffect(() => {
    if (!type) return;

    removeJsonLdScripts(type);
    if (!serialized) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-json-ld', type);
    script.textContent = serialized;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [serialized, type]);
}
