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

#### Jest Snapshot Testing

We use Jest's built-in snapshot testing feature to verify test outputs. Jest will compare the output against previously saved snapshots stored in `__snapshots__` directories.

Here is how you can use `factory.setOne()` with Jest snapshots:

```typescript
test('bookFlight should create booking successfully', () => {
    // Setup test doubles
    factory.setOne(BookingRepositoryImpl, new BookingRepositoryStub());
    // ... setup other dependencies

    const coordinator = new BookingCoordinatorImpl();
    const result = coordinator.bookFlight(/* parameters */);

    expect(result.toString()).toMatchSnapshot();
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

This kata uses Jest's built-in snapshot testing feature, which is included with Jest (version 29.7.0 or later).

Add to your `package.json`:
```json
{
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2",
    "specrec-ts": "file:../../specrec/specrec-ts"
  }
}
```

Install with:
```bash
npm install
```

⚠️ **Important**: You'll need to handle test isolation and cleanup manually in TypeScript, so consider using `beforeEach` and `afterEach` for ObjectFactory clearing.

⚠️ **Note on Precision**: TypeScript uses IEEE 754 double-precision floating point numbers, which may introduce precision issues with monetary calculations. The Java version uses BigDecimal for precise decimal arithmetic. Consider using a decimal library like `decimal.js` for production applications requiring exact decimal calculations.

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