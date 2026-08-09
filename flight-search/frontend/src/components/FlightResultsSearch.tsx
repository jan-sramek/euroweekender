import { useTranslation } from 'react-i18next';
import './FlightResultsSearch.css';

interface FlightResultsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function FlightResultsSearch({ value, onChange }: FlightResultsSearchProps) {
  const { t } = useTranslation();

  return (
    <div className="results-search">
      <label className="results-search-label" htmlFor="flight-results-search">
        {t('home.resultsSearchLabel')}
      </label>
      <div className="results-search-field">
        <svg className="results-search-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M10.5 3.75a6.75 6.75 0 1 0 4.2 12.05l3.75 3.75a.75.75 0 1 0 1.06-1.06l-3.75-3.75A6.75 6.75 0 0 0 10.5 3.75Zm-5.25 6.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Z"
          />
        </svg>
        <input
          id="flight-results-search"
          className="results-search-input"
          type="search"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={t('home.resultsSearchPlaceholder')}
          autoComplete="off"
          spellCheck={false}
        />
        {value.trim() ? (
          <button
            type="button"
            className="results-search-clear"
            onClick={() => onChange('')}
            aria-label={t('home.clearResultsSearch')}
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
