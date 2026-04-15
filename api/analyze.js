/**
 * @file analyze.js
 * @description Vercel serverless function — WaitWise /api/analyze endpoint.
 * Validates input, applies rate-limit via in-memory counter, runs simulation,
 * and returns a structured boarding recommendation.
 */

const { validateInput } = require('../backend/lib/validate');
const { runSimulation } = require('../backend/lib/simulation');
const { buildResponse } = require('../backend/lib/response');

/* -------------------------------------------------------------------------- */
/*  Simple in-process rate-limiting (per-IP, 30 req / 60 s window)           */
/*  For production scale use Upstash Redis or Vercel KV.                      */
/* -------------------------------------------------------------------------- */
/** @type {Map<string, {count: number, resetAt: number}>} */
const rateLimitStore = new Map();
const RATE_LIMIT = 30;
const WINDOW_MS  = 60_000;

/**
 * Checks whether the requesting IP has exceeded the rate limit.
 * @param {string} ip - Client IP address.
 * @returns {boolean} `true` if the request should be blocked.
 */
function isRateLimited(ip) {
  const now  = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/* -------------------------------------------------------------------------- */
/*  Simple in-memory cache — keyed by stop:route:hour, TTL 60 s              */
/* -------------------------------------------------------------------------- */
/** @type {Map<string, {data: object, expiresAt: number}>} */
const cache = new Map();

/**
 * Generates a deterministic cache key for the request parameters.
 * @param {string} stop  - Transit stop identifier.
 * @param {string} route - Route / line name.
 * @param {string} time  - Time string (HH:MM).
 * @returns {string} Cache key.
 */
function cacheKey(stop, route, time) {
  const hour = time.split(':')[0] || '0';
  return `${stop.toLowerCase()}:${route.toLowerCase()}:${hour}`;
}

/**
 * Returns cached data for a key, or `null` if absent / expired.
 * @param {string} key
 * @returns {object|null}
 */
function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
}

/**
 * Stores simulation data in cache with a 60-second TTL.
 * @param {string} key
 * @param {object} data
 */
function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + 60_000 });
}

/* -------------------------------------------------------------------------- */
/*  Security helpers                                                           */
/* -------------------------------------------------------------------------- */
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || '*',
];

/**
 * Sets CORS and security response headers.
 * @param {import('http').ServerResponse} res
 * @param {string} origin
 */
function setHeaders(res, origin) {
  const allowed = ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed ? (origin || '*') : '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=()');
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Vercel serverless handler for POST /api/analyze.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  setHeaders(res, origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || '127.0.0.1';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
    return;
  }

  // Parse body (Vercel parses JSON automatically in most runtimes)
  const body = req.body || {};
  const { stop, route, time } = body;

  // Input validation
  const validationError = validateInput({ stop, route, time });
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  // Cache check
  const key = cacheKey(stop, route, time);
  const cached = getCache(key);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.status(200).json(cached);
    return;
  }

  // Simulate (artificial 300 ms latency kept for realistic UX)
  await new Promise(r => setTimeout(r, 300));
  const simulation = runSimulation({ stop, route, time });
  const payload    = buildResponse(simulation, { stop, route, time });

  setCache(key, payload);
  res.setHeader('X-Cache', 'MISS');
  res.status(200).json(payload);
};
