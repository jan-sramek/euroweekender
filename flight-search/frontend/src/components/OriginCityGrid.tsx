import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { CityGroupedFlightsView } from './CityGroupedFlightsView';

interface OriginCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
  departureLegFilter: string | null;
  returnLegFilter: string | null;
  onDepartureSelect: (flight: Flight, selected: boolean) => void;
  onReturnSelect: (flight: Flight, selected: boolean) => void;
}

/** Cities view: origins as expandable rows with flights nested under each city. */
export function OriginCityGrid(props: OriginCityGridProps) {
  return <CityGroupedFlightsView {...props} mode="origin" />;
}
