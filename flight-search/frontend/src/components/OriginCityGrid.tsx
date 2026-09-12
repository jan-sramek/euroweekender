import type { City } from '../types/city';
import type { Flight } from '../types/flight';
import { GroupedCityList } from './GroupedCityList';

interface OriginCityGridProps {
  flights: Flight[];
  citiesByCode: Map<string, City>;
  passengerCount: number;
}

/** Cities results: origins grouped as a row list (no photo cards). */
export function OriginCityGrid({ flights, citiesByCode, passengerCount }: OriginCityGridProps) {
  return (
    <GroupedCityList
      flights={flights}
      citiesByCode={citiesByCode}
      passengerCount={passengerCount}
      mode="origin"
    />
  );
}
