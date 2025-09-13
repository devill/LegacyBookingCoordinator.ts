import { FlightAvailabilityService } from './FlightAvailabilityService';
import { CanNotUseInTestsException } from './CanNotUseInTestsException';

export class FlightAvailabilityServiceImpl implements FlightAvailabilityService {
  private readonly airlineApiConfig: string;

  constructor(connectionString: string) {
    throw new CanNotUseInTestsException('FlightAvailabilityServiceImpl');
  }

  checkAndGetAvailableSeatsForBooking(flightNumber: string, departureDate: Date, passengerCount: number): string[] {
    throw new CanNotUseInTestsException('FlightAvailabilityServiceImpl');
  }

  isFlightFullyBooked(flightNumber: string, departureDate: Date): boolean {
    throw new CanNotUseInTestsException('FlightAvailabilityServiceImpl');
  }
}