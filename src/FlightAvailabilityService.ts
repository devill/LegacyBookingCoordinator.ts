/**
 * Interface for flight availability operations
 */
export interface FlightAvailabilityService {
  checkAndGetAvailableSeatsForBooking(flightNumber: string, departureDate: Date, passengerCount: number): string[];

  isFlightFullyBooked(flightNumber: string, departureDate: Date): boolean;
}