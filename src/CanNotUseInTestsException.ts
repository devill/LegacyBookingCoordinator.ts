export class CanNotUseInTestsException extends Error {
  constructor(className: string) {
    super(`Cannot use ${className} in tests - this class has external dependencies!`);
    this.name = 'CanNotUseInTestsException';
  }
}