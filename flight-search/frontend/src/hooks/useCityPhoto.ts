import { useEffect, useState } from 'react';
import {
  fetchWikipediaCityPhoto,
  getCuratedCityPhoto,
  getFallbackCityPhoto,
  wikipediaPhotoCacheKey
} from '../utils/cityPhotos';

const memoryCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
let activeFetches = 0;
const waiters: Array<() => void> = [];
const MAX_CONCURRENT = 4;

function readSessionCache(code: string): string | null {
  try {
    return sessionStorage.getItem(wikipediaPhotoCacheKey(code));
  } catch {
    return null;
  }
}

function writeSessionCache(code: string, url: string) {
  try {
    sessionStorage.setItem(wikipediaPhotoCacheKey(code), url);
  } catch {
    /* quota / private mode */
  }
}

function acquireSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT) {
    activeFetches += 1;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    waiters.push(() => {
      activeFetches += 1;
      resolve();
    });
  });
}

function releaseSlot() {
  activeFetches = Math.max(0, activeFetches - 1);
  const next = waiters.shift();
  if (next) next();
}

async function resolveCityPhoto(cityCode: string, cityName: string, country: string): Promise<string> {
  const curated = getCuratedCityPhoto(cityCode);
  if (curated) return curated;

  const cached = memoryCache.get(cityCode) ?? readSessionCache(cityCode);
  if (cached) {
    memoryCache.set(cityCode, cached);
    return cached;
  }

  const existing = inflight.get(cityCode);
  if (existing) return existing;

  const request = (async () => {
    await acquireSlot();
    try {
      const wiki = await fetchWikipediaCityPhoto(cityName, country);
      const url = wiki || getFallbackCityPhoto();
      memoryCache.set(cityCode, url);
      if (wiki) writeSessionCache(cityCode, url);
      return url;
    } catch {
      return getFallbackCityPhoto();
    } finally {
      inflight.delete(cityCode);
      releaseSlot();
    }
  })();

  inflight.set(cityCode, request);
  return request;
}

export function useCityPhoto(cityCode: string, cityName: string, country: string): string {
  const curated = getCuratedCityPhoto(cityCode);
  const initial = curated ?? memoryCache.get(cityCode) ?? readSessionCache(cityCode) ?? getFallbackCityPhoto();
  const [url, setUrl] = useState(initial);

  useEffect(() => {
    if (curated) {
      setUrl(curated);
      return;
    }

    const cached = memoryCache.get(cityCode) ?? readSessionCache(cityCode);
    if (cached) {
      setUrl(cached);
      return;
    }

    let cancelled = false;
    void resolveCityPhoto(cityCode, cityName, country).then(resolved => {
      if (!cancelled) setUrl(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [cityCode, cityName, country, curated]);

  return url;
}
