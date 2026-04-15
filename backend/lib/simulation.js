/**
 * @file simulation.js
 * @description Core crowd simulation engine for WaitWise.
 * Generates realistic vehicle crowd-score and arrival data
 * based on time-band analysis.
 */

/* -------------------------------------------------------------------------- */
/*  Time-band helpers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * High-pressure time bands (morning and evening peak hours).
 * @type {Array<{from: number, to: number}>}
 */
const PEAK_BANDS = [
  { from: 7.5,  to: 9.5  },   // morning rush
  { from: 17.5, to: 19.5 },   // evening rush
];

/**
 * Converts a HH:MM time string to a decimal hour float.
 * @param {string} timeStr - Time in "HH:MM" format.
 * @returns {number} Decimal hour (e.g. "08:30" → 8.5).
 */
function timeToFloat(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

/**
 * Determines whether the given time falls within a peak-hour band.
 * @param {string} timeStr - Time in "HH:MM" format.
 * @returns {boolean} `true` if peak hour.
 */
function isPeakHour(timeStr) {
  const t = timeToFloat(timeStr);
  return PEAK_BANDS.some(({ from, to }) => t >= from && t <= to);
}

/* -------------------------------------------------------------------------- */
/*  Random helpers                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns a random integer in the range [min, max] (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random float in the range [min, max), rounded to 1 decimal place.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomFloat(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/* -------------------------------------------------------------------------- */
/*  Vehicle helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Converts a crowd score (0–100) to a 0–9 stress index.
 * @param {number} score - Crowd occupancy percentage.
 * @returns {number} Stress index rounded to 1 decimal place.
 */
function crowdToStressIndex(score) {
  return Math.round((score / 100) * 9 * 10) / 10;
}

/**
 * Maps a crowd score to a human-readable comfort tag.
 * @param {number} score - Crowd occupancy percentage.
 * @returns {'Comfortable'|'Moderate'|'Packed'}
 */
function crowdToTag(score) {
  if (score <= 40) return 'Comfortable';
  if (score <= 70) return 'Moderate';
  return 'Packed';
}

/* -------------------------------------------------------------------------- */
/*  Core simulation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * @typedef {Object} VehicleSim
 * @property {string}  label        - Display name (e.g. "Vehicle 1").
 * @property {number}  arrivesInMin - Minutes until arrival.
 * @property {number}  crowdScore   - Occupancy percentage (0–100).
 * @property {number}  stressIndex  - Comfort stress index (0–9).
 * @property {string}  tag          - Human-readable tag.
 * @property {boolean} recommended  - Whether this is the recommended vehicle.
 */

/**
 * @typedef {Object} SimulationResult
 * @property {VehicleSim[]} vehicles        - Simulated vehicles.
 * @property {string}       verdict         - "WAIT" or "BOARD NOW".
 * @property {number}       waitSeconds     - Seconds to wait if verdict is WAIT.
 * @property {number}       patiencePayoff  - Comfort payoff score (0–100).
 * @property {number}       timeSavedSeconds - Estimated time saved in seconds.
 * @property {boolean}      isPeak          - Whether the time is peak hour.
 */

/**
 * Runs the crowd simulation for a given stop, route, and time.
 * @param {{ stop: string, route: string, time: string }} params
 * @returns {SimulationResult}
 */
function runSimulation({ stop, route, time }) {
  const peak = isPeakHour(time);

  // Vehicle 1 — arrives soon; crowded during peak
  const v1Arrives = randomFloat(1.5, 2.5);
  const v1Score   = peak ? randomInt(78, 97) : randomInt(30, 60);

  // Vehicle 2 — the "ghost" vehicle: always lightly loaded
  const v2Arrives = randomFloat(3.2, 4.5);
  const v2Score   = randomInt(15, 38);

  // Vehicle 3 — moderate occupancy
  const v3Arrives = randomFloat(6.5, 8.0);
  const v3Score   = randomInt(45, 70);

  // Determine verdict
  const verdict     = v1Score > 70 ? 'WAIT' : 'BOARD NOW';
  const waitSeconds = verdict === 'WAIT'
    ? Math.round((v2Arrives - v1Arrives) * 60)
    : 0;

  // Payoff metrics
  const patiencePayoff   = Math.min(100, Math.round(((v1Score - v2Score) / 100) * 90 + 10));
  const timeSavedSeconds = Math.max(0, Math.round((v1Score - v2Score) * 2.5));

  /** @type {VehicleSim[]} */
  const vehicles = [
    { label: 'Vehicle 1', arrivesInMin: v1Arrives, crowdScore: v1Score, stressIndex: crowdToStressIndex(v1Score), tag: crowdToTag(v1Score), recommended: false },
    { label: 'Vehicle 2', arrivesInMin: v2Arrives, crowdScore: v2Score, stressIndex: crowdToStressIndex(v2Score), tag: crowdToTag(v2Score), recommended: false },
    { label: 'Vehicle 3', arrivesInMin: v3Arrives, crowdScore: v3Score, stressIndex: crowdToStressIndex(v3Score), tag: crowdToTag(v3Score), recommended: false },
  ];

  // Mark the least crowded vehicle as recommended
  const minScore = Math.min(...vehicles.map(v => v.crowdScore));
  const rec = vehicles.find(v => v.crowdScore === minScore);
  if (rec) rec.recommended = true;

  return { vehicles, verdict, waitSeconds, patiencePayoff, timeSavedSeconds, isPeak: peak };
}

module.exports = { runSimulation, isPeakHour, timeToFloat, crowdToStressIndex, crowdToTag, randomInt, randomFloat };
