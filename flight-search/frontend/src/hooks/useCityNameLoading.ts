import { useEffect, useState } from 'react';

type Listener = () => void;

let pendingPriority = 0;
let languageSwitchPending = false;
let pendingSwitchLocale: string | null = null;
let switchTimeout = 0;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function snapshot(): CityNameLoadingState {
  return {
    namesLoading: pendingPriority > 0,
    switchPending: languageSwitchPending,
    pendingLocale: pendingSwitchLocale,
    busy: pendingPriority > 0 || languageSwitchPending
  };
}

/** Track a city-name fetch that should show the language-switch indicator. */
export function trackPriorityCityNameLoad<T>(promise: Promise<T>): Promise<T> {
  pendingPriority += 1;
  emit();
  return promise.finally(() => {
    pendingPriority = Math.max(0, pendingPriority - 1);
    emit();
  });
}

export function beginLanguageSwitch(locale: string): void {
  pendingSwitchLocale = locale;
  languageSwitchPending = true;
  if (typeof window !== 'undefined') {
    window.clearTimeout(switchTimeout);
    switchTimeout = window.setTimeout(() => endLanguageSwitch(), 12000);
  }
  emit();
}

export function endLanguageSwitch(): void {
  if (typeof window !== 'undefined') window.clearTimeout(switchTimeout);
  if (!languageSwitchPending && pendingSwitchLocale == null) return;
  languageSwitchPending = false;
  pendingSwitchLocale = null;
  emit();
}

export interface CityNameLoadingState {
  namesLoading: boolean;
  switchPending: boolean;
  pendingLocale: string | null;
  busy: boolean;
}

export function useCityNameLoading(): CityNameLoadingState {
  const [state, setState] = useState(snapshot);

  useEffect(() => {
    const listener = () => setState(snapshot());
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

export function useCityNamesLoading(): boolean {
  return useCityNameLoading().busy;
}
