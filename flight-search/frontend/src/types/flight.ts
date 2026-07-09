export interface Flight {
  id: number;
  countryTo: string;
  deepLink: string | null;
  fareAdults: number;
  nightsInDest: number;
  price: number;
  technicalStops: number;
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
