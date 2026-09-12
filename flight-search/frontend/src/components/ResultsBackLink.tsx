import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './ResultsBackLink.css';

const FLIGHTS_BACK_KEY = 'ew.flightsBack';

export interface FlightsNavState {
  backTo?: string;
  backLabel?: string;
}

export function rememberFlightsBack(backTo: string, backLabel: string): void {
  try {
    sessionStorage.setItem(FLIGHTS_BACK_KEY, JSON.stringify({ backTo, backLabel }));
  } catch {
    // Ignore quota / private-mode errors.
  }
}

function readStoredFlightsBack(): FlightsNavState | null {
  try {
    const raw = sessionStorage.getItem(FLIGHTS_BACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlightsNavState;
    if (!parsed || typeof parsed.backTo !== 'string' || !parsed.backTo.trim()) return null;
    return {
      backTo: parsed.backTo.trim(),
      backLabel: typeof parsed.backLabel === 'string' ? parsed.backLabel.trim() : undefined
    };
  } catch {
    return null;
  }
}

/** Back control for compare-weekends / OD landings opened from a city group row. */
export function ResultsBackLink() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state as FlightsNavState | null) ?? null;
  const stored = readStoredFlightsBack();
  const backTo = routeState?.backTo?.trim() || stored?.backTo;
  const label =
    routeState?.backLabel?.trim() || stored?.backLabel || t('home.backToResults');

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
