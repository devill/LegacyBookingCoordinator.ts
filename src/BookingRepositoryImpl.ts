import { BookingRepository } from './BookingRepository';
import { CanNotUseInTestsException } from './CanNotUseInTestsException';

export class BookingRepositoryImpl implements BookingRepository {
  private readonly connectionString: string;
  private readonly retryCount: number;

  constructor(dbConnectionString: string, maxRetries: number) {
    throw new CanNotUseInTestsException('BookingRepositoryImpl');
  }

  saveBookingDetails(passengerName: string, flightDetails: string, price: number, bookingDate: Date): string {
    throw new CanNotUseInTestsException('BookingRepositoryImpl');
  }

  getBookingInfo(bookingReference: string): Map<string, any> {
    throw new CanNotUseInTestsException('BookingRepositoryImpl');
  }

  validateAndEnrichBookingData(bookingRef: string): {
    success: boolean;
    actualPrice?: number;
    enrichedFlightInfo?: string;
  } {
    throw new CanNotUseInTestsException('BookingRepositoryImpl');
  }

  getHistoricalPricingData(flightNumber: string, date: Date, dayRange: number): number {
    throw new CanNotUseInTestsException('BookingRepositoryImpl');
  }
}