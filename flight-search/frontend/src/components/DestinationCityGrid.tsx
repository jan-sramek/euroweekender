import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { CityGroupedFlightsView } from './CityGroupedFlightsView';

interface DestinationCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

/** Cities view: destination rows that open the flights page for that route. */
export function DestinationCityGrid(props: DestinationCityGridProps) {
  return <CityGroupedFlightsView {...props} mode="destination" />;
}
