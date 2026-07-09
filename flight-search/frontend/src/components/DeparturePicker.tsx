import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City, CityWithDistance } from '../types/city';
import { LoadingIndicator } from './LoadingIndicator';
import './DeparturePicker.css';

interface DeparturePickerProps {
  allCities: City[];
  nearbyCities: CityWithDistance[];
  popularHubCities: CityWithDistance[];
  selectedCodes: string[];
  locating: boolean;
  locationLabel: string;
  onSelectedCodesChange: (codes: string[]) => void;
  onAddCity: (city: City) => void;
}

function formatNearby(city: CityWithDistance): string {
  const distance = city.distanceKm < 10 ? '<10' : Math.round(city.distanceKm);
  return `${city.name} (${city.code}) · ${distance} km`;
}

function formatPopularHub(city: CityWithDistance, offerCount: string): string {
  return `${city.code} · ${offerCount}`;
}

function formatCity(city: City): string {
  return `${city.name} (${city.code}), ${city.country}`;
}

export function DeparturePicker({
  allCities,
  nearbyCities,
  popularHubCities,
  selectedCodes,
  locating,
  locationLabel,
  onSelectedCodesChange,
  onAddCity
}: DeparturePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cityByCode = useMemo(() => {
    const map = new Map<string, City>();
    for (const city of allCities) {
      map.set(city.code, city);
    }
    return map;
  }, [allCities]);

  const selectedCities = useMemo(
    () =>
      selectedCodes
        .map(code => cityByCode.get(code))
        .filter((city): city is City => city !== undefined),
    [selectedCodes, cityByCode]
  );

  const nearbyNotSelected = useMemo(
    () => nearbyCities.filter(city => !selectedCodes.includes(city.code)),
    [nearbyCities, selectedCodes]
  );

  const popularHubsNotSelected = useMemo(
    () => popularHubCities.filter(city => !selectedCodes.includes(city.code)),
    [popularHubCities, selectedCodes]
  );

  const offerCountFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    []
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return allCities
      .filter(city => {
        if (selectedCodes.includes(city.code)) return false;
        return (
          city.code.toLowerCase().includes(q) ||
          city.name.toLowerCase().includes(q) ||
          city.country.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [allCities, query, selectedCodes]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const removeCity = (code: string) => {
    if (selectedCodes.length === 1) return;
    onSelectedCodesChange(selectedCodes.filter(c => c !== code));
  };

  const addNearby = (code: string) => {
    if (!selectedCodes.includes(code)) {
      onSelectedCodesChange([...selectedCodes, code]);
    }
  };

  const pickCity = (city: City) => {
    onAddCity(city);
    setQuery('');
    setOpen(false);
  };

  const placeholder = locating
    ? t('search.loadingAirports')
    : locationLabel
      ? t('search.fromLocationAdd', { location: locationLabel })
      : t('search.addAirport');

  return (
    <div className="departure-picker">
      {locating ? (
        <div className="departure-picker-locating" role="status" aria-live="polite">
          <LoadingIndicator size="sm" label={t('search.loadingAirports')} />
        </div>
      ) : null}

      {selectedCities.length > 0 && (
        <div className="airport-chips" role="group" aria-label={t('search.selectedAirports')}>
          {selectedCities.map(city => (
            <span key={city.code} className="chip chip-active chip-selected">
              {formatCity(city)}
              <button
                type="button"
                className="chip-remove"
                aria-label={t('search.removeAirport', { name: city.name })}
                disabled={selectedCodes.length === 1}
                onClick={() => removeCity(city.code)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="airport-search" ref={searchRef}>
        <input
          type="search"
          className="airport-search-input"
          placeholder={placeholder}
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={t('search.searchAirports')}
          autoComplete="off"
        />
        {open && query.trim().length >= 2 && (
          <ul className="airport-search-results" role="listbox">
            {searchResults.length === 0 ? (
              <li className="airport-search-empty">{t('search.noAirportsFound')}</li>
            ) : (
              searchResults.map(city => (
                <li key={city.code}>
                  <button type="button" className="airport-search-item" onClick={() => pickCity(city)}>
                    <strong>{city.name}</strong>
                    <span>
                      {city.code} · {city.country}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {nearbyNotSelected.length > 0 && (
        <div className="nearby-section">
          <p className="nearby-label">{t('search.nearbyAirports')}</p>
          <div className="airport-chips airport-chips-scroll" role="group" aria-label={t('search.nearbyAirports')}>
            {nearbyNotSelected.map(city => (
              <button
                key={city.code}
                type="button"
                className="chip chip-add"
                onClick={() => addNearby(city.code)}
              >
                + {formatNearby(city)}
              </button>
            ))}
          </div>
        </div>
      )}

      {popularHubsNotSelected.length > 0 && (
        <div className="popular-hubs-section">
          <p className="nearby-label">{t('search.popularHubAirports')}</p>
          <div
            className="airport-chips airport-chips-inline"
            role="group"
            aria-label={t('search.popularHubAirports')}
          >
            {popularHubsNotSelected.map(city => (
              <button
                key={city.code}
                type="button"
                className="chip chip-add chip-popular chip-compact"
                aria-label={t('search.addPopularHub', {
                  name: city.name,
                  count: offerCountFormatter.format(city.offerCount)
                })}
                onClick={() => addNearby(city.code)}
              >
                + {formatPopularHub(city, offerCountFormatter.format(city.offerCount))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
