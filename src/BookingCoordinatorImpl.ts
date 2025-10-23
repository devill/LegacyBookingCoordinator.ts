/*
 * WARNING: ABANDON ALL HOPE, YE WHO ENTER HERE
 *
 * This is the infamous BookingCoordinator - a monument to technical debt
 * and a testament to what happens when deadlines triumph over design.
 *
 * This code has claimed many victims. It's entangled, stateful, and has
 * side effects that ripple through dimensions unknown to mortal developers.
 * Every attempt to "improve" it has only made it stronger and more vengeful.
 *
 * The original developers have long since fled to safer pastures (or therapy).
 * Managers have learned not to mention refactoring within earshot of this file.
 * Even the automated tests are afraid to look directly at it.
 *
 * In case you decided to ignore this warning increment the counter below and sign
 * with your name and an emoji reflecting your current mental state.
 *
 * You are victim: #10
 * The knights who gave their best before you:
 *  - Jack 🥵
 *  - Bob 😱
 *  - Mary 🫣
 *  - Jack 🤬(again)
 *  - Nathan 🥺
 *  - Mary 🙈
 *  - June 😵
 *  - Nathan 🤮
 *  - Jack 😵‍💫 (I still didn't learn my lesson)
 */

import { Booking } from './Booking';
import { BookingRepository } from './BookingRepository';
import { BookingRepositoryImpl } from './BookingRepositoryImpl';
import { PricingEngine } from './PricingEngine';
import { FlightAvailabilityService } from './FlightAvailabilityService';
import { FlightAvailabilityServiceImpl } from './FlightAvailabilityServiceImpl';
import { PartnerNotifier } from './PartnerNotifier';
import { PartnerNotifierImpl } from './PartnerNotifierImpl';
import { AuditLogger } from './AuditLogger';
import { AuditLoggerImpl } from './AuditLoggerImpl';
import { create } from 'global-object-factory';

/**
 * Main coordinator for flight booking operations
 * Integrates with all airline partners and handles end-to-end booking flow
 * Last updated: 2018 (needs refactoring for new airline partnerships)
 */
export class BookingCoordinatorImpl {
  private lastBookingRef: string = ''; // Stores reference for debugging purposes
  private bookingCounter: number = 1; // Global counter for booking sequence
  private isProcessingBooking: boolean = false; // Thread safety flag (NOTE: not actually thread-safe)
  private readonly _bookingDate: Date;

  private temporaryData: Map<string, any> = new Map(); // Temporary storage for calculation intermediates

  constructor(bookingDate?: Date) {
    this._bookingDate = bookingDate || new Date();
  }

  /**
   * Main entry point for flight booking process
   * Coordinates all services and returns booking object
   * WARNING: This method is not thread-safe due to shared state
   */
  bookFlight(
    passengerName: string,
    flightNumber: string,
    departureDate: Date,
    passengerCount: number,
    airlineCode: string,
    specialRequests: string = ''
  ): Booking {
    // Set processing flag to prevent concurrent access
    this.isProcessingBooking = true;
    this.bookingCounter++; // Increment global booking counter

    // Initialize database connection (TODO: move to configuration file)
    const connectionString = 'Server=production-db;Database=FlightBookings;Trusted_Connection=true;';
    const maxRetries = this.calculateRetriesBasedOnBookingCount(); // Dynamic retry calculation

    // Create repository with calculated parameters
    const repository: BookingRepository = create(BookingRepositoryImpl)(connectionString, maxRetries);

    // Calculate pricing engine parameters based on current state
    const taxRate = this.calculateTaxRateBasedOnGlobalState(airlineCode);
    const airlineFees = this.buildAirlineFeesFromTemporaryData(airlineCode);
    const enableRandomSurcharges = this.bookingCounter % 3 === 0; // Enable surcharges every 3rd booking
    const regionCode = this.determineRegionFromFlightNumber(flightNumber);
    const historicalAverage = this.getHistoricalAverageFromRepository(repository, flightNumber);

    const pricingEngine = new PricingEngine(taxRate, airlineFees, enableRandomSurcharges, regionCode, historicalAverage, this._bookingDate);

    const availabilityConnectionString = this.modifyConnectionStringForAvailability(connectionString, flightNumber);
    const availabilityService: FlightAvailabilityService = create(FlightAvailabilityServiceImpl)(availabilityConnectionString);

    const availableSeats = availabilityService.checkAndGetAvailableSeatsForBooking(flightNumber, departureDate, passengerCount);
    if (availableSeats.length < passengerCount) {
      this.temporaryData.set('lastFailureReason', 'Not enough seats');
      this.isProcessingBooking = false;
      throw new Error('Not enough seats available');
    }

    const basePrice = pricingEngine.calculateBasePriceWithTaxes(flightNumber, departureDate, passengerCount, airlineCode);

    // Apply additional pricing adjustments not handled by PricingEngine
    const weekdayMultiplier = this.getWeekdayMultiplierAndUpdateGlobalState(departureDate);
    const seasonalBonus = this.calculateSeasonalBonusWithSideEffects(departureDate, flightNumber);
    const specialRequestSurcharge = this.processSpecialRequestsAndCalculateSurcharge(specialRequests, airlineCode);

    // Calculate final price with all adjustments
    let finalPrice = (basePrice * weekdayMultiplier) + seasonalBonus + specialRequestSurcharge;

    // Apply any promotional discounts
    const discountResult = pricingEngine.validatePricingParametersAndCalculateDiscount(flightNumber);
    if (discountResult.valid) {
      finalPrice -= discountResult.discount;
    }

    // Configure partner notification settings
    const smtpServer = this.determineSmtpServerFromAirlineCode(airlineCode);
    const useEncryption = this.bookingCounter % 2 === 0; // Alternate encryption for load balancing
    const partnerNotifier: PartnerNotifier = create(PartnerNotifierImpl)(smtpServer, useEncryption);

    // Setup audit logging with dynamic configuration
    const logDirectory = this.calculateLogDirectoryFromBookingCount();
    const verboseMode = this.temporaryData.has('debugMode'); // Enable verbose mode if debug flag set
    const auditLogger: AuditLogger = create(AuditLoggerImpl)(logDirectory, verboseMode);

    // Generate unique booking reference
    const bookingReference = this.generateBookingReferenceAndUpdateCounters(passengerName, flightNumber);
    this.lastBookingRef = bookingReference; // Store for debugging and error tracking

    // Save booking details
    const actualBookingRef = repository.saveBookingDetails(
      passengerName,
      `${flightNumber} on ${departureDate.toISOString().slice(0, 10)} for ${passengerCount} passengers`,
      finalPrice,
      this._bookingDate
    );

    // Log the booking activity
    auditLogger.logBookingActivity('Flight Booked', actualBookingRef, `Passenger: ${passengerName}, Flight: ${flightNumber}`);

    auditLogger.recordPricingCalculation(
      `Base: ${basePrice}, Weekday: ${weekdayMultiplier}, Seasonal: ${seasonalBonus}, Special: ${specialRequestSurcharge}, Discount: ${discountResult.discount}`,
      finalPrice,
      `${flightNumber} on ${departureDate.toISOString().slice(0, 10)}`
    );

    // Partner notification
    if (this.shouldNotifyPartnerBasedOnAirlineAndState(airlineCode)) {
      partnerNotifier.notifyPartnerAboutBooking(
        airlineCode,
        actualBookingRef,
        finalPrice,
        passengerName,
        `${flightNumber} departing ${departureDate.toISOString()}`,
        false
      );

      // Handle special requests
      if (specialRequests && specialRequests.length > 0 && this.requiresSpecialNotification(airlineCode, specialRequests)) {
        partnerNotifier.validateAndNotifySpecialRequests(airlineCode, specialRequests, actualBookingRef);
      }
    }

    const bookingStatus = this.determineBookingStatusFromGlobalState(finalPrice, passengerCount);
    partnerNotifier.updatePartnerBookingStatus(airlineCode, actualBookingRef, bookingStatus);

    this.temporaryData.set('lastBookingPrice', finalPrice);
    this.temporaryData.set('lastBookingDate', this._bookingDate);
    this.isProcessingBooking = false;

    return new Booking(
      actualBookingRef,
      passengerName,
      flightNumber,
      departureDate,
      passengerCount,
      airlineCode,
      finalPrice,
      specialRequests,
      this._bookingDate,
      bookingStatus
    );
  }

  private calculateRetriesBasedOnBookingCount(): number {
    this.temporaryData.set('calculationCount', (this.temporaryData.get('calculationCount') || 0) + 1);
    return Math.min(5, Math.floor(this.bookingCounter / 10) + 1);
  }

  private calculateTaxRateBasedOnGlobalState(airlineCode: string): number {
    let baseRate = 1.18;
    if (this.temporaryData.has('lastFailureReason')) {
      baseRate += 0.05;
    }

    this.temporaryData.set('lastProcessedAirline', airlineCode);

    return baseRate;
  }

  private buildAirlineFeesFromTemporaryData(airlineCode: string): Map<string, number> {
    const fees = new Map<string, number>();

    if (this.temporaryData.has('lastBookingPrice')) {
      const lastPrice = this.temporaryData.get('lastBookingPrice') as number;
      fees.set(airlineCode, lastPrice * 0.02);
    } else {
      fees.set(airlineCode, 25.0);
    }

    if (this.bookingCounter > 10) {
      fees.set(airlineCode, (fees.get(airlineCode) || 0) + 10.0);
    }

    return fees;
  }

  private determineRegionFromFlightNumber(flightNumber: string): string {
    this.temporaryData.set('lastFlightNumber', flightNumber);

    if (flightNumber.startsWith('AA') || flightNumber.startsWith('UA')) {
      return 'US';
    } else if (flightNumber.startsWith('BA') || flightNumber.startsWith('VS')) {
      return 'UK';
    } else {
      return 'INTL';
    }
  }

  private getHistoricalAverageFromRepository(repository: BookingRepository, flightNumber: string): number {
    this.temporaryData.set('historicalLookupCount', (this.temporaryData.get('historicalLookupCount') || 0) + 1);

    return 450.0 + (flightNumber.length * 10);
  }

  private modifyConnectionStringForAvailability(originalConnectionString: string, flightNumber: string): string {
    const modified = originalConnectionString.replace('FlightBookings', `FlightAvailability_${flightNumber.substring(0, 2)}`);

    this.temporaryData.set('lastConnectionString', modified);

    return modified;
  }

  private getWeekdayMultiplierAndUpdateGlobalState(departureDate: Date): number {
    this.temporaryData.set('lastDepartureDate', departureDate);

    const dayOfWeek = departureDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 0) { // Friday or Sunday
      this.temporaryData.set('isPeakDay', true);
      return 1.25;
    } else if (dayOfWeek === 2 || dayOfWeek === 3) { // Tuesday or Wednesday
      this.temporaryData.set('isPeakDay', false);
      return 0.9;
    }

    this.temporaryData.set('isPeakDay', false);
    return 1.0;
  }

  private calculateSeasonalBonusWithSideEffects(departureDate: Date, flightNumber: string): number {
    const month = departureDate.getMonth() + 1; // JavaScript months are 0-indexed
    let bonus = 0.0;

    if (month >= 6 && month <= 8) {
      bonus = 50.0;
      this.temporaryData.set('currentSeason', 'Summer');
    } else if (month >= 12 || month <= 2) {
      bonus = 75.0;
      this.temporaryData.set('currentSeason', 'Winter');
    } else {
      bonus = 25.0;
      this.temporaryData.set('currentSeason', 'OffPeak');
    }

    if (this.bookingCounter % 5 === 0) {
      bonus += 20.0;
      this.temporaryData.set('luckyBooking', true);
    }

    return bonus;
  }

  private processSpecialRequestsAndCalculateSurcharge(specialRequests: string, airlineCode: string): number {
    let surcharge = 0.0;

    if (!specialRequests || specialRequests.length === 0) {
      return surcharge;
    }

    this.temporaryData.set('hasSpecialRequests', true);
    this.temporaryData.set('specialRequestsCount', specialRequests.split(',').length);

    if (specialRequests.includes('wheelchair')) {
      surcharge += airlineCode === 'AA' ? 0.0 : 25.0;
    }

    if (specialRequests.includes('meal')) {
      surcharge += airlineCode === 'BA' ? 15.0 : 20.0;
    }

    if (specialRequests.includes('seat')) {
      surcharge += 35.0;
    }

    return surcharge;
  }

  private determineSmtpServerFromAirlineCode(airlineCode: string): string {
    this.temporaryData.set('lastSmtpLookup', new Date());

    switch (airlineCode) {
      case 'AA':
        return 'smtp.american.com';
      case 'UA':
        return 'smtp.united.com';
      case 'BA':
        return 'smtp.britishairways.com';
      default:
        return 'smtp.generic-airline.com';
    }
  }

  private calculateLogDirectoryFromBookingCount(): string {
    let baseDir = '/var/logs/BookingLogs';

    if (this.bookingCounter > 100) {
      baseDir += '/HighVolume';
    } else if (this.bookingCounter > 50) {
      baseDir += '/MediumVolume';
    } else {
      baseDir += '/LowVolume';
    }

    this.temporaryData.set('currentLogDirectory', baseDir);

    return baseDir;
  }

  private generateBookingReferenceAndUpdateCounters(passengerName: string, flightNumber: string): string {
    const reference = `${flightNumber}${this.bookingCounter.toString().padStart(4, '0')}${passengerName
      .substring(0, Math.min(3, passengerName.length))
      .toUpperCase()}`;

    this.temporaryData.set('lastGeneratedReference', reference);
    this.temporaryData.set('referenceGenerationCount', (this.temporaryData.get('referenceGenerationCount') || 0) + 1);

    return reference;
  }

  private shouldNotifyPartnerBasedOnAirlineAndState(airlineCode: string): boolean {
    if (this.temporaryData.has('lastFailureReason')) {
      return false;
    }

    if (this.bookingCounter < 5) {
      return airlineCode === 'AA';
    }

    return true;
  }

  private requiresSpecialNotification(airlineCode: string, specialRequests: string): boolean {
    if (airlineCode === 'BA' && specialRequests.includes('meal')) {
      return true;
    }

    if (airlineCode === 'AA' && specialRequests.includes('wheelchair')) {
      return true;
    }

    return specialRequests.split(',').length > 2;
  }

  private determineBookingStatusFromGlobalState(finalPrice: number, passengerCount: number): string {
    let status = 'CONFIRMED';

    if (this.temporaryData.has('isPeakDay') && this.temporaryData.get('isPeakDay')) {
      status = 'CONFIRMED_PEAK';
    }

    if (finalPrice > 1000) {
      status = 'CONFIRMED_PREMIUM';
    }

    if (passengerCount > 5) {
      status = 'CONFIRMED_GROUP';
    }

    this.temporaryData.set('lastBookingStatus', status);

    return status;
  }
}