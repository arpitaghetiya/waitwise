/**
 * @file server.js
 * @description Local Express development server for WaitWise.
 * In production, the /api/analyze handler runs as a Vercel serverless function.
 */

'use strict';

const express       = require('express');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const helmet        = require('helmet');

const { validateInput }  = require('./lib/validate');
const { runSimulation }  = require('./lib/simulation');
const { buildResponse }  = require('./lib/response');

const app = express();

/* -------------------------------------------------------------------------- */
/*  Security middleware                                                        */
/* -------------------------------------------------------------------------- */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '10kb' }));

/* -------------------------------------------------------------------------- */
/*  Rate limiting — 30 requests per minute per IP                             */
/* -------------------------------------------------------------------------- */
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment.' },
});

app.use('/api', limiter);

/* -------------------------------------------------------------------------- */
/*  In-memory cache — (stop:route:hour) → payload, 60 s TTL                  */
/* -------------------------------------------------------------------------- */
/** @type {Map<string, {data: object, expiresAt: number}>} */
const cache = new Map();

/**
 * Returns a deterministic cache key.
 * @param {string} stop
 * @param {string} route
 * @param {string} time
 * @returns {string}
 */
function cacheKey(stop, route, time) {
  const hour = time.split(':')[0] || '0';
  return `${stop.toLowerCase()}:${route.toLowerCase()}:${hour}`;
}

/**
 * Retrieves cached data or null if expired/absent.
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
 * Stores data in cache with a 60-second TTL.
 * @param {string} key
 * @param {object} data
 */
function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + 60_000 });
}

/* -------------------------------------------------------------------------- */
/*  Routes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/analyze
 * Accepts { stop, route, time } and returns a boarding recommendation.
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { stop, route, time } = req.body;

    const validationError = validateInput({ stop, route, time });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const key    = cacheKey(stop, route, time);
    const cached = getCache(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // 300 ms artificial delay for realistic UX feel
    await new Promise(resolve => setTimeout(resolve, 300));

    const simulation = runSimulation({ stop, route, time });
    const payload    = buildResponse(simulation, { stop, route, time });

    setCache(key, payload);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(payload);

  } catch (err) {
    console.error('[WaitWise] Internal error:', err);
    return res.status(500).json({ error: 'Internal server error during analysis.' });
  }
});

/* -------------------------------------------------------------------------- */
/*  Start                                                                     */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WaitWise API running → http://localhost:${PORT}`);
});

module.exports = app; // exported for supertest
