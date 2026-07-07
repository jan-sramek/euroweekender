export interface Flight {
  id: number;
  kiwiId: string;
  countryFrom: string;
  countryTo: string;
  deepLink: string | null;
  distance: number;
  durationDeparture: number;
  durationReturn: number;
  durationTotal: number;
  facilitatedBookingAvailable: boolean;
  fareAdults: number;
  nightsInDest: number;
  price: number;
  quality: number;
  technicalStops: number;
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
  utcArrival: string;
  utcDeparture: string;
  availabilitySeats: number | null;
}

export interface FlightPage {
  items: Flight[];
  totalCount: number;
  page: number;
  pageSize: number;
}
