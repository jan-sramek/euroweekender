import { useEffect } from 'react';

/** Injects a single application/ld+json script into <head> and removes it on cleanup/change. */
export function useJsonLd(data: object | null | undefined): void {
  const serialized = data ? JSON.stringify(data) : null;

  useEffect(() => {
    if (!serialized) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = serialized;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [serialized]);
}
