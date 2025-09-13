import { AuditLogger } from './AuditLogger';
import { CanNotUseInTestsException } from './CanNotUseInTestsException';

export class AuditLoggerImpl implements AuditLogger {
  private readonly filePath: string;
  private readonly enableConsoleOutput: boolean;

  constructor(logDirectory: string, verboseMode: boolean) {
    throw new CanNotUseInTestsException('AuditLoggerImpl');
  }

  logBookingActivity(activity: string, bookingReference: string, userInfo: string): void {
    throw new CanNotUseInTestsException('AuditLoggerImpl');
  }

  recordPricingCalculation(calculationDetails: string, finalPrice: number, flightInfo: string): void {
    throw new CanNotUseInTestsException('AuditLoggerImpl');
  }

  logErrorWithAlert(ex: Error, context: string, bookingRef: string): void {
    throw new CanNotUseInTestsException('AuditLoggerImpl');
  }

  flushAndArchiveLogs(): void {
    throw new CanNotUseInTestsException('AuditLoggerImpl');
  }
}