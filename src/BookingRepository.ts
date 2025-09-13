/**
 * Interface for booking repository operations
 */
export interface BookingRepository {
  saveBookingDetails(passengerName: string, flightDetails: string, price: number, bookingDate: Date): string;

  getBookingInfo(bookingReference: string): Map<string, any>;

  validateAndEnrichBookingData(bookingRef: string): {
    success: boolean;
    actualPrice?: number;
    enrichedFlightInfo?: string;
  };

  getHistoricalPricingData(flightNumber: string, date: Date, dayRange: number): number;
}