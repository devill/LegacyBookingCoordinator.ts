import { PartnerNotifier } from './PartnerNotifier';
import { CanNotUseInTestsException } from './CanNotUseInTestsException';

export class PartnerNotifierImpl implements PartnerNotifier {
  private readonly logDestination: string;
  private readonly enableSecureMode: boolean;

  constructor(smtpServer: string, useEncryption: boolean) {
    throw new CanNotUseInTestsException('PartnerNotifierImpl');
  }

  notifyPartnerAboutBooking(
    airlineCode: string,
    bookingReference: string,
    totalPrice: number,
    passengerName: string,
    flightDetails: string,
    isRebooking: boolean = false
  ): void {
    throw new CanNotUseInTestsException('PartnerNotifierImpl');
  }

  validateAndNotifySpecialRequests(airlineCode: string, specialRequests: string, bookingRef: string): boolean {
    throw new CanNotUseInTestsException('PartnerNotifierImpl');
  }

  updatePartnerBookingStatus(airlineCode: string, bookingRef: string, newStatus: string): void {
    throw new CanNotUseInTestsException('PartnerNotifierImpl');
  }
}