# Code Kata: *Legacy Flight Booking System Testing*

# 🎯 Objective:

Introduce testability into an entangled legacy system responsible for managing flight bookings, pricing, and external integrations.

## 💼 Business Context:

Your company maintains a **legacy monolithic flight booking system**, originally written in a hurry for a client with ever-changing airline partnership rules. The original developers are long gone, and now you're tasked with adding **unit tests** and eventually decoupling and refactoring the system.

**Unfortunately:**

* Classes instantiate each other *directly* with `new`.
* Side effects (logging, emailing, pricing calls) happen all over the place.
* There is **no clean dependency injection**, no container, no interfaces.
* Changes require fear-driven development, unless something changes…

### What the legacy code does

The booking system coordinates:

1. **FlightAvailabilityService**: Queries seat availability.
2. **PricingEngine**: Applies dynamic pricing rules based on time, demand, and airline quirks.
3. **PartnerNotifier**: Notifies airlines about confirmed bookings with airline-specific formatting.
4. **AuditLogger**: Writes booking activity logs to disk.
5. **BookingRepository**: Saves booking data to a proprietary database (only available in production).
6. **BookingCoordinatorImpl**: The main orchestrator that coordinates all the services.

# 🏆 Challenges

## 🥉 Inject dependencies

Did you ever run into a codebase so awkward and full of hard to override dependencies that even the thought of writing a test is daunting? When the dreaded `new` keyword liters a codebase, writing tests after the fact is a nightmare. Luckily, the `ObjectFactory` can help you out.

### 🔧 Task

Use an `ObjectFactory` pattern to write a test for `BookingCoordinatorImpl.bookFlight()` that:
* Uses stubs instead of the untestable classes
* Checks that it returns the booking reference produced by the `BookingRepository`
* All *without extensive changes to the production code*.

This is **impossible** without changing the code. With an `ObjectFactory`, you can refactor the `new` calls to use `factory.create<T>()` and inject test doubles that record behavior.

### 🏭 Concept: ObjectFactory

The `ObjectFactory` acts as a drop-in replacement for the `new` keyword, allowing you to control object creation in tests.

Instead of:
```typescript
const logger = new AuditLoggerImpl(logDirectory, verboseMode);
```

Use:
```typescript
const logger = factory.create(AuditLoggerImpl, logDirectory, verboseMode);
```

Or for interface types:
```typescript
const logger = factory.create<AuditLogger>(AuditLoggerImpl, logDirectory, verboseMode);
```

In tests, you can override what gets created:
```typescript
// For concrete types
factory.setAlways(AuditLoggerImpl, new FakeAuditLogger());
// For interface types
factory.setAlways<AuditLogger>(new FakeAuditLogger());
// Return this fake once, then normal creation
factory.setOne(PricingEngine, new FakePricingEngine());
```

#### @approvals/approvals verify

When using @approvals/approvals we use Jest's `test()` function with approval testing. The approval library will compare the output against previously approved results stored in `.approved.txt` files.

Here is how you can call `factory.setOne()` using @approvals/approvals:

```typescript
import { verify } from '@approvals/approvals';

test('bookFlight should create booking successfully', () => {
  // Setup test doubles
  factory.setOne(BookingRepositoryImpl, new BookingRepositoryStub());
  // ... setup other dependencies

  const coordinator = new BookingCoordinatorImpl();
  const result = coordinator.bookFlight(/* parameters */);

  verify(result.toString());
});
```

#### Constructor arguments

If you want to test constructor arguments make sure your test double implements a method to capture constructor parameters. You can create a simple interface for this:

```typescript
interface ConstructorAware {
  constructorCalledWith(...parameters: any[]): void;
}
```

Each parameter contains the constructor argument, allowing for better test logging and verification.

#### Singleton instance

You can either inject an instance of the factory (harder, but better long term) or use the Singleton instance:
```typescript
ObjectFactory.getInstance().create(YourClass, ...constructorArgs);
```

Or use a static import for cleaner syntax:
```typescript
import { create } from './ObjectFactory';

create(YourClass, ...constructorArgs);
```

## 📦 Prerequisites

This kata requires the **@approvals/approvals** library (version 2.3.0 or later) which provides approval testing utilities for Node.js/TypeScript.

Add to your `package.json`:
```json
{
  "devDependencies": {
    "@approvals/approvals": "^2.3.0",
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

Install with:
```bash
npm install
```

⚠️ **Important**: You'll need to handle test isolation and cleanup manually in TypeScript, so consider using `beforeEach` and `afterEach` for ObjectFactory clearing.

⚠️ **Note on Precision**: TypeScript uses IEEE 754 double-precision floating point numbers, which may introduce precision issues with monetary calculations. The Java version uses BigDecimal for precise decimal arithmetic. Consider using a decimal library like `decimal.js` for production applications requiring exact decimal calculations.

## 🥈 Test the interactions

Now that you can inject dependencies, you have another problem: how do you implement test doubles and end up with an easy-to-read test? Setting up multiple mocks can become very time-consuming, but with a `CallLogger` it's easy.

### 🛠️ Task

Improve the test for `BookingCoordinatorImpl.bookFlight()` so that:
* It checks the booking was saved as expected.
* It checks a notification was sent to the correct place.
* It checks price calculation is correct.
* Verifies logging occurred.

Use @approvals/approvals to create a comprehensive record of all method calls.

### ☎️ Concept: CallLogger / Wrapper Pattern

You can create wrapper test doubles that automatically log all method calls:

```typescript
import { verify } from '@approvals/approvals';

test('bookFlight should create booking successfully', () => {
  factory.setOne(EmailService, new LoggingEmailServiceWrapper(new EmailServiceStub(), '📧'));

  // All method calls will be automatically logged
  const coordinator = new BookingCoordinatorImpl();
  const result = coordinator.bookFlight(/* parameters */);

  verify(result.toString());
});
```

## 🏅 Eliminate stub implementations

Writing stub implementations for every dependency gets tedious fast. But did you notice that the approval files actually contain the return values? What if the return values were parsed from the latest approved call log? That is what a `Parrot` test double does for you.

### 🎯 Task

Replace your wrapped stubs with `Parrot` test doubles that automatically replay method interactions from approved files. This eliminates the need to write and maintain stub implementations entirely.

### 🦜 Concept: Parrot Test Doubles

You can create Parrot test doubles that replay method interactions from approved files:

```typescript
import { verify } from '@approvals/approvals';

test('bookFlight should create booking successfully', () => {
  factory.setOne(BookingRepository, new ParrotBookingRepository('💾'));

  // The Parrot will automatically replay interactions from the approved file
  const coordinator = new BookingCoordinatorImpl();
  const result = coordinator.bookFlight(/* parameters */);

  verify(result.toString());
});
```

Normally the first run throws an exception about missing return values. Fill in return values in the `.received.txt` file, then approve it by copying to `.approved.txt`. Repeat until green.

However, since you already have an approved call log with return values, the test should pass right away.

### 🔗 Alternative: Fluent Factory Pattern

You can create a fluent factory API to handle multiple substitutions:

```typescript
import { verify } from '@approvals/approvals';

test('bookFlight should create booking successfully', () => {
  factory
    .substitute(BookingRepositoryImpl, new ParrotBookingRepository('💾'))
    .substitute(FlightAvailabilityServiceImpl, new ParrotFlightService('✈️'))
    .substitute(PartnerNotifierImpl, new ParrotPartnerNotifier('📣'));

  // Same functionality as individual Parrots, but with fluent API
  const coordinator = new BookingCoordinatorImpl();
  const result = coordinator.bookFlight(/* parameters */);

  verify(result.toString());
});
```

This approach gives you the ability to keep track of multiple different objects of the same type, each with separate IDs.

## 💎 Comprehensive scenario testing

By now we have one test, but oh no... we need more. 😩 Don't worry, it won't take forever! Now that we read values from the approved call logs, we can have multiple approval files testing different scenarios.

### 🎯 Task

Transform your single test into a comprehensive test suite that covers multiple booking scenarios using Jest's `test.each()`. Instead of writing multiple similar tests, you'll define the system under test once and create approved files for each scenario.

### 🏆 Concept: Parameterized Approval Tests

Use Jest's parameterized tests with approval testing:

```typescript
import { verify } from '@approvals/approvals';

const scenarios = [
  'StandardBooking',
  'NoAvailability',
  'PremiumBooking'
];

test.each(scenarios)('bookFlight multiple scenarios: %s', (scenario) => {
  // Configure test based on scenario
  // Each scenario gets its own .approved.txt file

  const coordinator = new BookingCoordinatorImpl();
  const result = coordinator.bookFlight(/* parameters */);

  verify(result.toString(), {
    namer: {
      name: `BookingCoordinator.test.bookFlightMultipleScenarios.${scenario}`
    }
  });
});
```

Create files like `BookingCoordinator.test.bookFlightMultipleScenarios.StandardBooking.approved.txt` and `BookingCoordinator.test.bookFlightMultipleScenarios.NoAvailability.approved.txt`. Each file runs as its own test automatically.

If you need to inject test values, you can create a test data object or use the scenario parameter to vary the test inputs for different scenarios.

## 🚀 Running the Tests

To run the tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run a specific test:

```bash
npm test -- --testNamePattern="bookFlight should create booking successfully"
```

To build the TypeScript:

```bash
npm run build
```