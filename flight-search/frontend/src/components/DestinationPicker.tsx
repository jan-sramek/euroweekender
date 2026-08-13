import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { City } from '../types/city';
import { SEO_POPULAR_DESTINATIONS } from '../data/seoPopularRoutes';
import { useCityTypeahead } from '../hooks/useCityTypeahead';
import { loadDealSnapshot } from '../hooks/useEmptyStateDeals';
import {
  DESTINATION_SUGGEST_MAX_CITIES,
  rankCitiesForDestinationSuggest
} from '../services/locationPrefill';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { isEuropeanCity } from '../utils/europe';
import { useLocale } from '../hooks/useLocale';
import { CountryFlag } from './CountryFlag';
import './DeparturePicker.css';

const POPULAR_DESTINATION_CODES = SEO_POPULAR_DESTINATIONS.map(city => city.code);

interface DestinationPickerProps {
  allCities: City[];
  /** Used to rank empty-query suggestions by fares from this origin. */
  originCity?: City | null;
  excludeCode?: string | null;
  selectedCode: string | null;
  onSelectedCodeChange: (code: string | null) => void;
  /** Keep a chip-row height even when nothing is selected so paired fields stay aligned. */
  reserveChipSlot?: boolean;
  /** Ask the parent to resolve Kiwi names for these destination suggestions. */
  onLocalizeCodes?: (codes: string[]) => void;
}

function formatCity(city: City, language: string): string {
  return `${getCityDisplayName(city, language)} (${city.code}), ${city.country}`;
}

function displayName(city: City & { localizedName?: string }, language: string): string {
  return getCityDisplayName(city, language);
}

export function DestinationPicker({
  allCities,
  originCity = null,
  excludeCode,
  selectedCode,
  onSelectedCodeChange,
  reserveChipSlot = false,
  onLocalizeCodes
}: DestinationPickerProps) {
  const { t } = useTranslation();
  const language = useLocale();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [originDestinations, setOriginDestinations] = useState<
    Array<{ code: string; minPrice?: number; offerCount?: number }>
  >([]);
  const [originDestinationsReady, setOriginDestinationsReady] = useState(!originCity);
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

  const originCode = originCity?.code.trim().toUpperCase() ?? '';

  useEffect(() => {
    if (!originCode) {
      setOriginDestinations(prev => (prev.length === 0 ? prev : []));
      setOriginDestinationsReady(true);
      return;
    }

    setOriginDestinationsReady(false);
    let cancelled = false;
    void loadDealSnapshot().then(snapshot => {
      if (cancelled) return;
      const dests = snapshot?.destinationsByOrigin?.[originCode] ?? [];
      setOriginDestinations(dests);
      setOriginDestinationsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [originCode]);

  const suggestedCities = useMemo(
    () =>
      rankCitiesForDestinationSuggest(allCities, {
        excludeCodes,
        filter: isEuropeanCity,
        limit: DESTINATION_SUGGEST_MAX_CITIES,
        originDestinations,
        popularCodes: POPULAR_DESTINATION_CODES,
        nameForSort: city => getCityDisplayName(city, language)
      }),
    [allCities, excludeCodes, language, originDestinations]
  );

  useEffect(() => {
    if (!open || !onLocalizeCodes || suggestedCities.length === 0) return;
    onLocalizeCodes(suggestedCities.slice(0, 12).map(city => city.code));
  }, [onLocalizeCodes, open, suggestedCities]);

  const { results: searchResults, isSearching } = useCityTypeahead({
    allCities,
    query,
    excludeCodes,
    filterCity: isEuropeanCity,
    limit: 8
  });

  const trimmedQuery = query.trim();
  const showSearchResults = open && trimmedQuery.length >= 1;
  const showEmptySuggestions =
    open && trimmedQuery.length < 1 && originDestinationsReady && suggestedCities.length > 0;

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
              {formatCity(selectedCity, language)}
              <button
                type="button"
                className="chip-remove"
                aria-label={t('search.removeAirport', {
                  name: getCityDisplayName(selectedCity, language)
                })}
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
        {(showSearchResults || showEmptySuggestions) && (
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
                        <strong>{displayName(city, language)}</strong>
                        <span>
                          {city.code} · {city.country}
                          {displayName(city, language).toLowerCase() !== city.name.toLowerCase()
                            ? ` · ${city.name}`
                            : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )
            ) : (
              suggestedCities.map(city => (
                <li key={city.code}>
                  <button type="button" className="airport-search-item" onClick={() => pickCity(city)}>
                    <CountryFlag country={city.country} />
                    <span className="airport-search-item-text">
                      <strong>{displayName(city, language)}</strong>
                      <span>
                        {city.code} · {city.country}
                        {city.minPrice != null
                          ? ` · ${t('weekendFlightsFrom.destinationPrice', {
                              price: Math.round(city.minPrice)
                            })}`
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
