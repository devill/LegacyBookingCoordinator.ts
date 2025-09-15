/**
 * Simple Random number generator class to match C# Random API
 */
export class Random {
  /**
   * Returns a random integer between min (inclusive) and max (exclusive)
   */
  next(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}