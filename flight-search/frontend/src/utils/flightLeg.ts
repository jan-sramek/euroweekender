import type { Flight } from '../types/flight';
import { addLocalDays, formatLocalDateTimeIso, parseApiLocalDateTime } from './flightTime';

export const EVENING_DEPART_HOUR = 17;

export function getReturnDepartDate(flight: Flight): Date {
  if (flight.localReturnDeparture) {
    return parseApiLocalDateTime(flight.localReturnDeparture);
  }

  // Fallback for flights crawled before return times were stored.
  const estimatedReturnArrive = addLocalDays(flight.localArrival, flight.nightsInDest);
  const durationMinutes = Math.round(flight.durationReturn);
  const returnDepart = new Date(estimatedReturnArrive);
  returnDepart.setTime(estimatedReturnArrive.getTime() - durationMinutes * 60_000);
  return returnDepart;
}

export function getReturnArriveDate(flight: Flight): Date {
  if (flight.localReturnArrival) {
    return parseApiLocalDateTime(flight.localReturnArrival);
  }

  const returnDepart = getReturnDepartDate(flight);
  const returnArrive = new Date(returnDepart);
  returnArrive.setTime(returnDepart.getTime() + Math.round(flight.durationReturn) * 60_000);
  return returnArrive;
}

export function isEveningDeparture(date: Date, eveningHour = EVENING_DEPART_HOUR): boolean {
  return date.getHours() * 60 + date.getMinutes() >= eveningHour * 60;
}

export function getDepartureLegKey(flight: Flight): string {
  return `dep:${flight.localDeparture}:${flight.flyFrom}:${flight.flyTo}:${flight.localArrival}`;
}

export function getReturnLegKey(flight: Flight): string {
  const returnDepartIso =
    flight.localReturnDeparture ?? formatLocalDateTimeIso(getReturnDepartDate(flight));
  const returnArriveIso =
    flight.localReturnArrival ?? formatLocalDateTimeIso(getReturnArriveDate(flight));

  return `ret:${returnDepartIso}:${flight.flyTo}:${flight.flyFrom}:${returnArriveIso}`;
}

export function filterFlightsByLegSelection(
  flights: Flight[],
  departureLegKey: string | null,
  returnLegKey: string | null
): Flight[] {
  return flights.filter(flight => {
    if (departureLegKey !== null && getDepartureLegKey(flight) !== departureLegKey) {
      return false;
    }
    if (returnLegKey !== null && getReturnLegKey(flight) !== returnLegKey) {
      return false;
    }
    return true;
  });
}
