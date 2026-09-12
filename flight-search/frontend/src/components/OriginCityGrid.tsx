import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { CityGroupedFlightsView } from './CityGroupedFlightsView';

interface OriginCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

/** Cities view: origin rows that open the flights page for that route. */
export function OriginCityGrid(props: OriginCityGridProps) {
  return <CityGroupedFlightsView {...props} mode="origin" />;
}
