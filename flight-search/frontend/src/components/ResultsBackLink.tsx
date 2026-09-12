import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ResultsBackLink.css';

export interface FlightsNavState {
  backTo?: string;
  backLabel?: string;
}

/** Back control for compare-weekends / OD landings opened from a city group row. */
export function ResultsBackLink() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as FlightsNavState | null) ?? null;
  const backTo = routeState?.backTo?.trim();
  const label = routeState?.backLabel?.trim() || t('home.backToResults');

  useEffect(() => {
    // Drop legacy session key from earlier builds so it cannot override history.
    try {
      sessionStorage.removeItem('ew.flightsBack');
    } catch {
      // Ignore private-mode errors.
    }
  }, []);

  // Only trust router state from the click that opened this page.
  if (backTo) {
    return (
      <p className="results-back">
        <Link className="results-back-link" to={backTo} data-umami-event="results_back">
          ← {label}
        </Link>
      </p>
    );
  }

  return (
    <p className="results-back">
      <button
        type="button"
        className="results-back-link"
        onClick={() => navigate(-1)}
        data-umami-event="results_back"
      >
        ← {label}
      </button>
    </p>
  );
}
