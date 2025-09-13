/**
 * Interface for audit logging operations
 */
export interface AuditLogger {
  logBookingActivity(activity: string, bookingReference: string, userInfo: string): void;
  recordPricingCalculation(calculationDetails: string, finalPrice: number, flightInfo: string): void;
  logErrorWithAlert(ex: Error, context: string, bookingRef: string): void;
  flushAndArchiveLogs(): void;
}