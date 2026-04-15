/**
 * @file validate.test.js
 * @description Unit tests for the input validation/sanitization module.
 */

'use strict';

const { validateInput, sanitizeInput, sanitize } = require('../lib/validate');

/* -------------------------------------------------------------------------- */
/*  sanitize                                                                   */
/* -------------------------------------------------------------------------- */
describe('sanitize', () => {
  test('trims whitespace', () => expect(sanitize('  hello  ')).toBe('hello'));
  test('removes <', () => expect(sanitize('a<b')).toBe('ab'));
  test('removes >', () => expect(sanitize('a>b')).toBe('ab'));
  test('removes single quote', () => expect(sanitize("a'b")).toBe('ab'));
  test('removes double quote', () => expect(sanitize('a"b')).toBe('ab'));
  test('removes backtick', () => expect(sanitize('a`b')).toBe('ab'));
  test('removes semicolon', () => expect(sanitize('a;b')).toBe('ab'));
  test('removes backslash', () => expect(sanitize('a\\b')).toBe('ab'));
  test('returns empty string for non-string', () => expect(sanitize(123)).toBe(''));
  test('returns empty string for null', () => expect(sanitize(null)).toBe(''));
  test('truncates at 120 chars', () => {
    const long = 'a'.repeat(200);
    expect(sanitize(long)).toHaveLength(120);
  });
  test('allows alphanumeric and spaces', () => {
    expect(sanitize('MG Road Metro 47')).toBe('MG Road Metro 47');
  });
});

/* -------------------------------------------------------------------------- */
/*  validateInput                                                              */
/* -------------------------------------------------------------------------- */
describe('validateInput', () => {
  const valid = { stop: 'MG Road', route: 'Green Line 47', time: '08:30' };

  test('returns null for valid input', () => expect(validateInput(valid)).toBeNull());

  test('returns error when stop is missing', () => {
    expect(validateInput({ ...valid, stop: '' })).toMatch(/stop/i);
  });
  test('returns error when route is missing', () => {
    expect(validateInput({ ...valid, route: '' })).toMatch(/route/i);
  });
  test('returns error when time is missing', () => {
    expect(validateInput({ ...valid, time: '' })).toMatch(/time/i);
  });

  test('returns error for invalid time "abc"', () => {
    expect(validateInput({ ...valid, time: 'abc' })).toMatch(/time/i);
  });
  test('returns error for time "25:00"', () => {
    expect(validateInput({ ...valid, time: '25:00' })).toMatch(/time/i);
  });
  test('returns error for time "08:60"', () => {
    expect(validateInput({ ...valid, time: '08:60' })).toMatch(/time/i);
  });
  test('accepts "00:00"', () => expect(validateInput({ ...valid, time: '00:00' })).toBeNull());
  test('accepts "23:59"', () => expect(validateInput({ ...valid, time: '23:59' })).toBeNull());

  test('returns error for undefined stop', () => {
    expect(validateInput({ stop: undefined, route: valid.route, time: valid.time })).toMatch(/stop/i);
  });
});

/* -------------------------------------------------------------------------- */
/*  sanitizeInput                                                              */
/* -------------------------------------------------------------------------- */
describe('sanitizeInput', () => {
  test('strips HTML from stop field', () => {
    const { stop } = sanitizeInput({ stop: '<script>evil</script>', route: 'R', time: '08:00' });
    expect(stop).not.toContain('<');
    expect(stop).not.toContain('>');
  });
  test('returns all three fields', () => {
    const result = sanitizeInput({ stop: 'MG Road', route: 'GL47', time: '08:00' });
    expect(result).toHaveProperty('stop');
    expect(result).toHaveProperty('route');
    expect(result).toHaveProperty('time');
  });
});
