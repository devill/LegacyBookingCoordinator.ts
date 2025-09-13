import { verify } from '@approvals/approvals';
import { BookingCoordinatorImpl } from '../src/BookingCoordinatorImpl';

describe('BookingCoordinatorImpl', () => {
  test('bookFlight should create booking successfully', () => {
    // Arrange
    const passengerName = 'John Doe';
    const flightNumber = 'AA123';
    const departureDate = new Date(2025, 6, 3, 12, 42, 11); // July 3, 2025 12:42:11
    const passengerCount = 2;
    const airlineCode = 'AA';
    const specialRequests = 'meal,wheelchair';

    // Act
    const coordinator = new BookingCoordinatorImpl();
    const result = coordinator.bookFlight(
      passengerName,
      flightNumber,
      departureDate,
      passengerCount,
      airlineCode,
      specialRequests
    );

    // Assert
    verify(result.toString());
  });
});