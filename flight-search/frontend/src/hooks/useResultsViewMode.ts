import { useCallback, useState } from 'react';

const STORAGE_KEY = 'ew-results-view';

export type ResultsViewMode = 'list' | 'cities';

function readStoredView(): ResultsViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'cities' ? 'cities' : 'list';
  } catch {
    return 'list';
  }
}

function writeStoredView(view: ResultsViewMode) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* private mode */
  }
}

export function useResultsViewMode(): [ResultsViewMode, (view: ResultsViewMode) => void] {
  const [view, setView] = useState<ResultsViewMode>(readStoredView);

  const changeView = useCallback((next: ResultsViewMode) => {
    setView(next);
    writeStoredView(next);
  }, []);

  return [view, changeView];
}
