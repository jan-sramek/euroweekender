import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import { useCityTypeahead } from '../hooks/useCityTypeahead';
import { isEuropeanCity } from '../utils/europe';
import { CountryFlag } from './CountryFlag';
import './DeparturePicker.css';

interface DestinationPickerProps {
  allCities: City[];
  excludeCode?: string | null;
  selectedCode: string | null;
  onSelectedCodeChange: (code: string | null) => void;
}

function formatCity(city: City): string {
  return `${city.name} (${city.code}), ${city.country}`;
}

function displayName(city: City & { localizedName?: string }): string {
  if (city.localizedName && city.localizedName.toLowerCase() !== city.name.toLowerCase()) {
    return city.localizedName;
  }
  return city.name;
}

export function DestinationPicker({
  allCities,
  excludeCode,
  selectedCode,
  onSelectedCodeChange
}: DestinationPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const europeanCities = useMemo(
    () => allCities.filter(city => isEuropeanCity(city) && city.code !== excludeCode),
    [allCities, excludeCode]
  );

  const selectedCity = useMemo(
    () => (selectedCode ? europeanCities.find(city => city.code === selectedCode) ?? null : null),
    [europeanCities, selectedCode]
  );

  const { results: searchResults, isSearching } = useCityTypeahead({
    allCities,
    query,
    excludeCodes: [
      ...(selectedCode ? [selectedCode] : []),
      ...(excludeCode ? [excludeCode] : [])
    ],
    filterCity: isEuropeanCity,
    limit: 8
  });

  useEffect(() => {
    if (selectedCode && excludeCode && selectedCode === excludeCode) {
      onSelectedCodeChange(null);
    }
  }, [excludeCode, selectedCode, onSelectedCodeChange]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const pickCity = (city: City) => {
    onSelectedCodeChange(city.code);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="departure-picker destination-picker">
      {selectedCity ? (
        <div className="airport-chips" role="group" aria-label={t('search.selectedDestination')}>
          <span className="chip chip-active chip-selected">
            <CountryFlag country={selectedCity.country} />
            {formatCity(selectedCity)}
            <button
              type="button"
              className="chip-remove"
              aria-label={t('search.removeAirport', { name: selectedCity.name })}
              onClick={() => onSelectedCodeChange(null)}
            >
              ×
            </button>
          </span>
        </div>
      ) : null}

      <div className="airport-search" ref={searchRef}>
        <input
          type="search"
          className="airport-search-input"
          placeholder={
            selectedCity ? t('search.changeDestinationAirport') : t('search.chooseDestinationAirport')
          }
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label={t('search.searchDestinations')}
          autoComplete="off"
        />
        {open && query.trim().length >= 1 && (
          <ul className="airport-search-results" role="listbox">
            {searchResults.length === 0 ? (
              <li className="airport-search-empty">
                {isSearching ? t('search.loadingAirports') : t('search.noAirportsFound')}
              </li>
            ) : (
              searchResults.map(city => (
                <li key={city.code}>
                  <button type="button" className="airport-search-item" onClick={() => pickCity(city)}>
                    <CountryFlag country={city.country} />
                    <span className="airport-search-item-text">
                      <strong>{displayName(city)}</strong>
                      <span>
                        {city.code} · {city.country}
                        {city.localizedName &&
                        city.localizedName.toLowerCase() !== city.name.toLowerCase()
                          ? ` · ${city.name}`
                          : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
