export class Booking {
  public readonly bookingReference: string;
  public readonly passengerName: string;
  public readonly flightNumber: string;
  public readonly departureDate: Date;
  public readonly passengerCount: number;
  public readonly airlineCode: string;
  public readonly finalPrice: number;
  public readonly specialRequests: string;
  public readonly bookingDate: Date;
  public readonly status: string;

  constructor(
    bookingReference: string,
    passengerName: string,
    flightNumber: string,
    departureDate: Date,
    passengerCount: number,
    airlineCode: string,
    finalPrice: number,
    specialRequests: string,
    bookingDate: Date,
    status: string
  ) {
    this.bookingReference = bookingReference;
    this.passengerName = passengerName;
    this.flightNumber = flightNumber;
    this.departureDate = departureDate;
    this.passengerCount = passengerCount;
    this.airlineCode = airlineCode;
    this.finalPrice = finalPrice;
    this.specialRequests = specialRequests;
    this.bookingDate = bookingDate;
    this.status = status;
  }

  toString(): string {
    const result: string[] = [];
    const formatter = (date: Date) => date.toISOString().slice(0, 16).replace('T', ' ');

    result.push(`New booking: ${this.bookingReference}`);
    result.push(`  👤 ${this.passengerName}`);
    result.push(`  ✈️ ${this.flightNumber}`);
    result.push(`  📅 ${formatter(this.departureDate)}`);
    result.push(`  👥 ${this.passengerCount}`);
    result.push(`  🏢 ${this.airlineCode}`);
    result.push(`  💰 $${this.finalPrice.toFixed(2)}`);

    if (this.specialRequests && this.specialRequests.length > 0) {
      result.push(`  🎯 ${this.specialRequests}`);
    }

    result.push(`  📝 ${formatter(this.bookingDate)}`);
    result.push(`  ✅ ${this.status}`);

    return result.join('\n');
  }
}