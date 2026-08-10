export interface Flight {
  id: number;
  countryTo: string;
  countryFrom?: string;
  deepLink: string | null;
  fareAdults: number;
  nightsInDest: number;
  price: number;
  technicalStops: number;
  /** Connection changes on the return leg; optional for older API responses. */
  technicalStopsReturn?: number;
  durationDeparture: number;
  durationReturn: number;
  flyTo: string;
  flyFrom: string;
  cityFrom: string;
  cityTo: string;
  cityCodeFrom: string;
  cityCodeTo: string;
  localArrival: string;
  localDeparture: string;
  localReturnDeparture: string | null;
  localReturnArrival: string | null;
  availabilitySeats: number | null;
}

export interface FlightPage {
  items: Flight[];
  totalCount: number;
  page: number;
  pageSize: number;
}
