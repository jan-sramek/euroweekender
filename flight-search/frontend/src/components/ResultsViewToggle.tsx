import { useTranslation } from 'react-i18next';
import type { ResultsViewMode } from '../hooks/useResultsViewMode';
import './ResultsViewToggle.css';

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.5 6.25h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Zm0 5h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Zm0 5h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1 0-1.5Z"
      />
    </svg>
  );
}

function CitiesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5.75 5A1.75 1.75 0 0 0 4 6.75v4.5c0 .966.784 1.75 1.75 1.75h4.5A1.75 1.75 0 0 0 12 11.25v-4.5A1.75 1.75 0 0 0 10.25 5h-4.5Zm0 9.5A1.75 1.75 0 0 0 4 16.25v1A1.75 1.75 0 0 0 5.75 19h4.5A1.75 1.75 0 0 0 12 17.25v-1a1.75 1.75 0 0 0-1.75-1.75h-4.5ZM13.75 5A1.75 1.75 0 0 0 12 6.75v1c0 .966.784 1.75 1.75 1.75h4.5A1.75 1.75 0 0 0 20 7.75v-1A1.75 1.75 0 0 0 18.25 5h-4.5Zm0 6.5A1.75 1.75 0 0 0 12 13.25v4.5c0 .966.784 1.75 1.75 1.75h4.5A1.75 1.75 0 0 0 20 17.75v-4.5a1.75 1.75 0 0 0-1.75-1.75h-4.5Z"
      />
    </svg>
  );
}

interface ResultsViewToggleProps {
  value: ResultsViewMode;
  onChange: (view: ResultsViewMode) => void;
}

export function ResultsViewToggle({ value, onChange }: ResultsViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="results-view-toggle" role="group" aria-label={t('home.resultsViewLabel')}>
      <button
        type="button"
        className="results-view-toggle-btn"
        aria-pressed={value === 'list'}
        aria-label={t('home.viewListAria')}
        title={t('home.viewList')}
        onClick={() => onChange('list')}
        data-umami-event="results_view_list"
      >
        <ListIcon />
        <span className="results-view-toggle-label">{t('home.viewList')}</span>
      </button>
      <button
        type="button"
        className="results-view-toggle-btn"
        aria-pressed={value === 'cities'}
        aria-label={t('home.viewCitiesAria')}
        title={t('home.viewCities')}
        onClick={() => onChange('cities')}
        data-umami-event="results_view_cities"
      >
        <CitiesIcon />
        <span className="results-view-toggle-label">{t('home.viewCities')}</span>
      </button>
    </div>
  );
}
