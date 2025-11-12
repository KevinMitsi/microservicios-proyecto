import { describe, test, expect } from '@jest/globals';

describe('Basic Health Tests', () => {
  test('should pass basic test', () => {
    expect(true).toBe(true);
  });

  test('should test basic math', () => {
    expect(2 + 2).toBe(4);
  });
});

describe('Environment Tests', () => {
  test('should have test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
