/**
 * Interface for partner notification operations
 */
export interface PartnerNotifier {
  notifyPartnerAboutBooking(
    airlineCode: string,
    bookingReference: string,
    totalPrice: number,
    passengerName: string,
    flightDetails: string,
    isRebooking?: boolean
  ): void;

  validateAndNotifySpecialRequests(airlineCode: string, specialRequests: string, bookingRef: string): boolean;

  updatePartnerBookingStatus(airlineCode: string, bookingRef: string, newStatus: string): void;
}