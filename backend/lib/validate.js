/**
 * @file validate.js
 * @description Input sanitization and validation for the /api/analyze endpoint.
 */

/** Maximum allowed length for stop/route strings. */
const MAX_STRING_LEN = 120;

/** Regex: HH:MM format (00:00 – 23:59) */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Strips characters that could be used for injection attacks,
 * and trims whitespace.
 * @param {*} value - Raw input value.
 * @returns {string} Sanitized string.
 */
function sanitize(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[<>'"`;\\]/g, '') // strip HTML / SQL special chars
    .substring(0, MAX_STRING_LEN);
}

/**
 * Validates and sanitizes the request body for the analyze endpoint.
 * @param {{ stop: *, route: *, time: * }} params - Raw request body fields.
 * @returns {string|null} An error message string if invalid, or `null` if valid.
 */
function validateInput({ stop, route, time }) {
  const cleanStop  = sanitize(stop);
  const cleanRoute = sanitize(route);
  const cleanTime  = sanitize(time);

  if (!cleanStop)  return 'Missing required field: stop.';
  if (!cleanRoute) return 'Missing required field: route.';
  if (!cleanTime)  return 'Missing required field: time.';

  if (!TIME_REGEX.test(cleanTime)) {
    return 'Invalid time format. Expected HH:MM (24-hour).';
  }

  return null;
}

/**
 * Returns sanitized versions of the input fields.
 * Useful when callers need the cleaned values after validation.
 * @param {{ stop: *, route: *, time: * }} params
 * @returns {{ stop: string, route: string, time: string }}
 */
function sanitizeInput({ stop, route, time }) {
  return {
    stop:  sanitize(stop),
    route: sanitize(route),
    time:  sanitize(time),
  };
}

module.exports = { validateInput, sanitizeInput, sanitize };
