/**
 * Helper function to use approvals library with Jest
 * Automatically extracts test name from Jest's expect context
 */
const approvals = require('approvals');

export function verifyWithApprovals(data: string): void {
  // Get the current test name from Jest's state
  const testName = expect.getState().currentTestName;

  if (!testName) {
    throw new Error('verifyWithApprovals must be called within a Jest test');
  }

  // Clean up the test name to create a valid filename
  // Jest provides the full name including describe blocks
  const cleanTestName = testName
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .trim();

  // Use __dirname from the test file (will be passed in)
  const callerDir = __dirname.replace('/test', '/test');

  approvals.verify(callerDir, cleanTestName, data);
}

// Export a function that captures the directory context
export function createVerify(testDir: string) {
  return function verify(data: string): void {
    const testName = expect.getState().currentTestName;

    if (!testName) {
      throw new Error('verify must be called within a Jest test');
    }

    const cleanTestName = testName
      .replace(/\s+/g, ' ')
      .trim();

    approvals.verify(testDir, cleanTestName, data);
  };
}