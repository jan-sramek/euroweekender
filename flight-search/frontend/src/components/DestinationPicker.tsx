import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import { useCityTypeahead } from '../hooks/useCityTypeahead';
import {
  DESTINATION_SUGGEST_MAX_CITIES,
  rankCitiesByDistance
} from '../services/locationPrefill';
import { isEuropeanCity } from '../utils/europe';
import { CountryFlag } from './CountryFlag';
import './DeparturePicker.css';

interface DestinationPickerProps {
  allCities: City[];
  /** Rank empty-query suggestions by distance from this origin. */
  originCity?: City | null;
  excludeCode?: string | null;
  selectedCode: string | null;
  onSelectedCodeChange: (code: string | null) => void;
  /** Keep a chip-row height even when nothing is selected so paired fields stay aligned. */
  reserveChipSlot?: boolean;
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
  originCity = null,
  excludeCode,
  selectedCode,
  onSelectedCodeChange,
  reserveChipSlot = false
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

  const excludeCodes = useMemo(
    () => [
      ...(selectedCode ? [selectedCode] : []),
      ...(excludeCode ? [excludeCode] : [])
    ],
    [selectedCode, excludeCode]
  );

  const nearbyByDistance = useMemo(() => {
    if (!originCity) return [];
    return rankCitiesByDistance(allCities, originCity, {
      excludeCodes,
      filter: isEuropeanCity,
      limit: DESTINATION_SUGGEST_MAX_CITIES
    });
  }, [allCities, excludeCodes, originCity]);

  const { results: searchResults, isSearching } = useCityTypeahead({
    allCities,
    query,
    excludeCodes,
    filterCity: isEuropeanCity,
    limit: 8
  });

  const trimmedQuery = query.trim();
  const showSearchResults = open && trimmedQuery.length >= 1;
  const showNearbySuggestions = open && trimmedQuery.length < 1 && nearbyByDistance.length > 0;

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
      {selectedCity || reserveChipSlot ? (
        <div
          className={`airport-chips${selectedCity ? '' : ' airport-chips-placeholder'}`}
          role={selectedCity ? 'group' : undefined}
          aria-hidden={selectedCity ? undefined : true}
          aria-label={selectedCity ? t('search.selectedDestination') : undefined}
        >
          {selectedCity ? (
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
          ) : null}
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
        {(showSearchResults || showNearbySuggestions) && (
          <ul className="airport-search-results" role="listbox">
            {showSearchResults ? (
              searchResults.length === 0 ? (
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
              )
            ) : (
              nearbyByDistance.map(city => {
                const distance = city.distanceKm < 10 ? '<10' : Math.round(city.distanceKm);
                return (
                  <li key={city.code}>
                    <button type="button" className="airport-search-item" onClick={() => pickCity(city)}>
                      <CountryFlag country={city.country} />
                      <span className="airport-search-item-text">
                        <strong>{displayName(city)}</strong>
                        <span>
                          {city.code} · {city.country} · {distance} km
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
