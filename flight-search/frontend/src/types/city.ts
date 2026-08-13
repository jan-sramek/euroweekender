export interface City {
  id: string;
  code: string;
  name: string;
  country: string;
  region: string | null;
  continent: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  /** Localized / alternate names used for multilingual search. */
  aliases?: string[];
  /** Display names keyed by Tequila locale (e.g. "cs-CZ": "Praha"). */
  namesByLocale?: Record<string, string>;
}

export interface CitySuggestion extends City {
  localizedName?: string;
}

export interface HubScore {
  code: string;
  offerCount: number;
  minPrice: number;
  averageQuality: number;
  destinationCount: number;
  hubScore: number;
}

export interface OriginDestination {
  code: string;
  offerCount: number;
  minPrice: number;
}

export interface CityWithDistance extends City {
  distanceKm: number;
  hubScore: number;
  effectiveScore: number;
  offerCount: number;
  minPrice: number | null;
}

/** Empty destination dropdown row: city plus an optional known weekend fare. */
export interface DestinationSuggestCity extends City {
  minPrice: number | null;
}
