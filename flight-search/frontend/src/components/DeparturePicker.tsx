import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City, CityWithDistance } from '../types/city';
import { useCityTypeahead } from '../hooks/useCityTypeahead';
import {
  NEARBY_MAX_CITIES,
  NEARBY_RADIUS_KM,
  rankCitiesByDistance
} from '../services/locationPrefill';
import { CountryFlag } from './CountryFlag';
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
  /** When true, selecting an airport replaces the current one (exactly one origin). */
  singleSelect?: boolean;
  /** Keep a chip-row height even when nothing is selected so paired fields stay aligned. */
  reserveChipSlot?: boolean;
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

function displayName(city: City & { localizedName?: string }): string {
  if (city.localizedName && city.localizedName.toLowerCase() !== city.name.toLowerCase()) {
    return city.localizedName;
  }
  return city.name;
}

export function DeparturePicker({
  allCities,
  nearbyCities,
  popularHubCities,
  selectedCodes,
  locating,
  locationLabel,
  onSelectedCodesChange,
  onAddCity,
  singleSelect = false,
  reserveChipSlot = false
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

  /** Empty-query dropdown: closest airports to the current origin first. */
  const nearbyByDistance = useMemo(() => {
    if (nearbyNotSelected.length > 0) {
      return [...nearbyNotSelected].sort(
        (a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name)
      );
    }

    const anchor = selectedCities[0];
    if (!anchor) return [];

    return rankCitiesByDistance(allCities, anchor, {
      excludeCodes: selectedCodes,
      limit: NEARBY_MAX_CITIES,
      radiusKm: NEARBY_RADIUS_KM
    });
  }, [allCities, nearbyNotSelected, selectedCities, selectedCodes]);

  const popularHubsNotSelected = useMemo(
    () => popularHubCities.filter(city => !selectedCodes.includes(city.code)),
    [popularHubCities, selectedCodes]
  );

  const trimmedQuery = query.trim();
  const showSearchResults = open && trimmedQuery.length >= 1;
  const showNearbySuggestions = open && trimmedQuery.length < 1 && nearbyByDistance.length > 0;

  const offerCountFormatter = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
    []
  );

  const { results: searchResults, isSearching } = useCityTypeahead({
    allCities,
    query,
    excludeCodes: selectedCodes,
    limit: 8
  });

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
    if (singleSelect) {
      onSelectedCodesChange([]);
      return;
    }
    if (selectedCodes.length === 1) return;
    onSelectedCodesChange(selectedCodes.filter(c => c !== code));
  };

  const selectCode = (code: string) => {
    if (singleSelect) {
      onSelectedCodesChange([code]);
      return;
    }
    if (!selectedCodes.includes(code)) {
      onSelectedCodesChange([...selectedCodes, code]);
    }
  };

  const pickCity = (city: City) => {
    if (singleSelect) {
      onSelectedCodesChange([city.code]);
    } else {
      onAddCity(city);
    }
    setQuery('');
    setOpen(false);
  };

  const placeholder = locating
    ? t('search.loadingAirports')
    : singleSelect
      ? selectedCities.length > 0
        ? t('search.changeDepartureAirport')
        : t('search.chooseDepartureAirport')
      : locationLabel
        ? t('search.fromLocationAdd', { location: locationLabel })
        : t('search.addAirport');

  return (
    <div className="departure-picker">
      {selectedCities.length > 0 || reserveChipSlot || locating ? (
        <div
          className={`airport-chips${
            selectedCities.length === 0 && !locating ? ' airport-chips-placeholder' : ''
          }`}
          role={selectedCities.length > 0 ? 'group' : undefined}
          aria-hidden={selectedCities.length === 0 && !locating ? true : undefined}
          aria-label={selectedCities.length > 0 ? t('search.selectedAirports') : undefined}
        >
          {locating ? (
            <div className="departure-picker-locating" role="status" aria-live="polite">
              <LoadingIndicator size="sm" label={t('search.loadingAirports')} />
            </div>
          ) : (
            selectedCities.map(city => (
              <span key={city.code} className="chip chip-active chip-selected">
                <CountryFlag country={city.country} />
                {formatCity(city)}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={t('search.removeAirport', { name: city.name })}
                  disabled={!singleSelect && selectedCodes.length === 1}
                  onClick={() => removeCity(city.code)}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      ) : null}

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

      {nearbyNotSelected.length > 0 && (
        <div className="nearby-section">
          <p className="nearby-label">{t('search.nearbyAirports')}</p>
          <div className="airport-chips airport-chips-scroll" role="group" aria-label={t('search.nearbyAirports')}>
            {nearbyNotSelected.map(city => (
              <button
                key={city.code}
                type="button"
                className="chip chip-add"
                onClick={() => selectCode(city.code)}
              >
                + <CountryFlag country={city.country} /> {formatNearby(city)}
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
                onClick={() => selectCode(city.code)}
              >
                + <CountryFlag country={city.country} />{' '}
                {formatPopularHub(city, offerCountFormatter.format(city.offerCount))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
