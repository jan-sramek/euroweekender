import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { GroupedCityList } from './GroupedCityList';

interface DestinationCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

/** Cities results: destinations grouped as a row list (no photo cards). */
export function DestinationCityGrid({
  flights,
  citiesByCode,
  passengerCount
}: DestinationCityGridProps) {
  return (
    <GroupedCityList
      flights={flights}
      citiesByCode={citiesByCode}
      passengerCount={passengerCount}
      mode="destination"
    />
  );
}
