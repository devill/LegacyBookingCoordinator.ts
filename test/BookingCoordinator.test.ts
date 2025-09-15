const approvals = require('approvals');
import { setOne, clearAll } from 'specrec-ts';
import {BookingCoordinatorImpl} from '../src/BookingCoordinatorImpl';
import {BookingRepository} from '../src/BookingRepository';
import {BookingRepositoryImpl} from '../src/BookingRepositoryImpl';
import {FlightAvailabilityService} from '../src/FlightAvailabilityService';
import {FlightAvailabilityServiceImpl} from '../src/FlightAvailabilityServiceImpl';
import {PartnerNotifier} from '../src/PartnerNotifier';
import {PartnerNotifierImpl} from '../src/PartnerNotifierImpl';
import {AuditLogger} from '../src/AuditLogger';
import {AuditLoggerImpl} from '../src/AuditLoggerImpl';

describe('BookingCoordinator', () => {
  let originalMathRandom: () => number;

  beforeEach(() => {
    clearAll();
    originalMathRandom = Math.random;
    // Mock Math.random to return deterministic value for testing
    Math.random = () => 0.6;
  });

  afterEach(() => {
    clearAll();
    Math.random = originalMathRandom;
  });

  test('bookFlight should create booking successfully', () => {
    // Test data
    const passengerName = 'John Doe';
    const flightNumber = 'AA123';
    const departureDate = new Date(2025, 6, 3, 12, 42); // July 3, 2025 12:42
    const passengerCount = 2;
    const airlineCode = 'AA';
    const specialRequests = 'meal,wheelchair';
    const bookingDate = new Date(2025, 2, 4, 14, 0, 56); // March 4, 2025 14:00:56

    // Setup stubs
    setOne(BookingRepositoryImpl, new BookingRepositoryStub());
    setOne(FlightAvailabilityServiceImpl, new FlightAvailabilityServiceStub());
    setOne(PartnerNotifierImpl, new PartnerNotifierStub());
    setOne(AuditLoggerImpl, new AuditLoggerStub());

    const coordinator = new BookingCoordinatorImpl(bookingDate);
    const result = coordinator.bookFlight(
      passengerName,
      flightNumber,
      departureDate,
      passengerCount,
      airlineCode,
      specialRequests
    );

    // Assert
    const output = result.toString();
    approvals.verify(__dirname, 'BookingCoordinator.test.bookFlight should create booking successfully', output);
  });
});

class BookingRepositoryStub implements BookingRepository {
  saveBookingDetails(passengerName: string, flightDetails: string, price: number, bookingDate: Date): string {
    return 'APPLE3.14';
  }

  getBookingInfo(bookingReference: string): Map<string, any> {
    throw new Error('Method not implemented.');
  }

  validateAndEnrichBookingData(bookingRef: string): { success: boolean; actualPrice?: number; enrichedFlightInfo?: string } {
    throw new Error('Method not implemented.');
  }

  getHistoricalPricingData(flightNumber: string, date: Date, dayRange: number): number {
    throw new Error('Method not implemented.');
  }
}

class FlightAvailabilityServiceStub implements FlightAvailabilityService {
  checkAndGetAvailableSeatsForBooking(flightNumber: string, departureDate: Date, passengerCount: number): string[] {
    return ['11A', '11B'];
  }

  isFlightFullyBooked(flightNumber: string, departureDate: Date): boolean {
    throw new Error('Method not implemented.');
  }
}

class PartnerNotifierStub implements PartnerNotifier {
  notifyPartnerAboutBooking(
    airlineCode: string,
    bookingReference: string,
    totalPrice: number,
    passengerName: string,
    flightDetails: string,
    isRebooking: boolean = false
  ): void {
    // Stub implementation - do nothing
  }

  validateAndNotifySpecialRequests(airlineCode: string, specialRequests: string, bookingRef: string): boolean {
    return true;
  }

  updatePartnerBookingStatus(airlineCode: string, bookingRef: string, newStatus: string): void {
    // Stub implementation - do nothing
  }
}

class AuditLoggerStub implements AuditLogger {
  logBookingActivity(activity: string, bookingReference: string, userInfo: string): void {
    // Stub implementation - do nothing
  }

  recordPricingCalculation(calculationDetails: string, finalPrice: number, flightInfo: string): void {
    // Stub implementation - do nothing
  }

  logErrorWithAlert(ex: Error, context: string, bookingRef: string): void {
    throw new Error('Method not implemented.');
  }

  flushAndArchiveLogs(): void {
    throw new Error('Method not implemented.');
  }
}

