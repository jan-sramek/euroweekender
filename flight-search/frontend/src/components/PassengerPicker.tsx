import { useTranslation } from 'react-i18next';
import { MAX_PASSENGERS, MIN_PASSENGERS } from '../utils/flightPrice';
import './PassengerPicker.css';
import './WeekendPicker.css';

interface PassengerPickerProps {
  count: number;
  onChange: (count: number) => void;
}

export function PassengerPicker({ count, onChange }: PassengerPickerProps) {
  const { t } = useTranslation();
  const decrease = () => onChange(Math.max(MIN_PASSENGERS, count - 1));
  const increase = () => onChange(Math.min(MAX_PASSENGERS, count + 1));

  return (
    <div className="pattern-track passenger-track" role="group" aria-label={t('search.travelersGroup')}>
      <button
        type="button"
        className="pattern-pill passenger-stepper-btn"
        onClick={decrease}
        disabled={count <= MIN_PASSENGERS}
        aria-label={t('search.fewerTravelers')}
      >
        −
      </button>
      <span className="pattern-pill pattern-pill-active passenger-count" aria-live="polite">
        {count} {count === 1 ? t('search.traveler') : t('search.travelers')}
      </span>
      <button
        type="button"
        className="pattern-pill passenger-stepper-btn"
        onClick={increase}
        disabled={count >= MAX_PASSENGERS}
        aria-label={t('search.moreTravelers')}
      >
        +
      </button>
    </div>
  );
}
