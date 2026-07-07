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
}

export interface HubScore {
  code: string;
  offerCount: number;
  minPrice: number;
  averageQuality: number;
  destinationCount: number;
  hubScore: number;
}

export interface CityWithDistance extends City {
  distanceKm: number;
  hubScore: number;
  effectiveScore: number;
  offerCount: number;
  minPrice: number | null;
}
