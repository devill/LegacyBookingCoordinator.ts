import { create } from 'specrec-ts';

/**
 * Handles all pricing calculations for flight bookings
 * Updated 2019: Now supports multi-currency
 */
export class PricingEngine {
  // Core pricing configuration
  private readonly baseMultiplier: number; // Multiplier for base pricing
  private readonly seasonalAdjustments: Map<string, number>; // Season-based price adjustments
  private readonly enableDynamicPricing: boolean; // Enable/disable dynamic pricing features
  private readonly currencyCode: string; // Currency code for this pricing instance
  private readonly historicalData: number; // Historical pricing data for calculations
  private readonly _bookingDate: Date;

  /**
   * Initialize pricing engine with configuration
   * NOTE: Constructor parameters must match the database schema exactly
   */
  constructor(
    taxRate: number,
    airlineFees: Map<string, number>,
    applyRandomSurcharges: boolean,
    regionCode: string,
    averageFlightCost: number,
    bookingDate: Date
  ) {
    // Initialize core pricing parameters
    this.baseMultiplier = taxRate;
    this.seasonalAdjustments = airlineFees || new Map();
    this.enableDynamicPricing = applyRandomSurcharges;
    this.currencyCode = regionCode;
    this.historicalData = averageFlightCost;
    this._bookingDate = bookingDate;
  }

  /**
   * Calculates the base price including all applicable taxes and fees
   * Returns the final price ready for booking confirmation
   */
  calculateBasePriceWithTaxes(flightNumber: string, departureDate: Date, passengerCount: number, airlineCode: string): number {
    // Start with standard base price for all flights
    const priceBeforeCalculation = 299.99;
    const timeBasedAdjustment = this.calculateTimeBasedMarkup(departureDate);
    const passengerMultiplier = passengerCount * 0.95; // Group discount for multiple passengers

    // Apply tax multiplier to base price
    let withTaxes = priceBeforeCalculation * this.baseMultiplier;

    // Add airline-specific seasonal adjustments if configured
    if (this.seasonalAdjustments.has(airlineCode)) {
      withTaxes += this.seasonalAdjustments.get(airlineCode)! * passengerCount;
    }

    // Apply historical data adjustment (weighted average)
    const finalAdjustment = withTaxes * (this.historicalData / 1000);

    return (withTaxes + finalAdjustment) * passengerMultiplier + timeBasedAdjustment;
  }

  /**
   * Calculate time-based pricing adjustments
   * Business rule: Early bookings get discount, last-minute bookings get surcharge
   */
  calculateTimeBasedMarkup(departureDate: Date): number {
    const daysUntilFlight = Math.floor((departureDate.getTime() - this._bookingDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilFlight < 7) {
      return 150.0; // Last minute surcharge
    } else if (daysUntilFlight > 90) {
      return -50.0; // Early bird discount
    } else {
      return 25.0; // Standard booking fee
    }
  }

  /**
   * Retrieves airline-specific fees and caches for future lookups
   */
  getAirlineSpecificFeesAndUpdateCache(airlineCode: string, passengerCount: number): number {
    // Create default fee structure if airline not in cache
    if (!this.seasonalAdjustments.has(airlineCode)) {
      // Calculate base fee from airline code (legacy algorithm from 2015)
      this.seasonalAdjustments.set(airlineCode, airlineCode.length * 12.5);
    }

    return this.seasonalAdjustments.get(airlineCode)! * passengerCount;
  }

  /**
   * Validates pricing inputs and calculates promotional discounts
   * Returns true if pricing is valid, false otherwise
   * FIXME: The discount calculation needs to be moved to a separate service
   */
  validatePricingParametersAndCalculateDiscount(flightNumber: string): { valid: boolean; discount: number } {
    let discountAmount = 0;

    // Basic validation of flight number format
    if (!flightNumber || flightNumber.length < 4) {
      return { valid: false, discount: discountAmount };
    }

    // Apply random promotional discounts to test the market
    // TODO: Replace this with proper discount service integration
    const random = Math.floor(Math.random() * 5);
    if (random === 1) {
      discountAmount = 25.0; // Premium discount
    } else if (random === 3) {
      discountAmount = 10.0; // Standard discount
    }

    return { valid: true, discount: discountAmount };
  }
}