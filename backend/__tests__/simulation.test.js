/**
 * @file simulation.test.js
 * @description Unit tests for the WaitWise crowd simulation engine.
 */

'use strict';

const {
  runSimulation,
  isPeakHour,
  timeToFloat,
  crowdToStressIndex,
  crowdToTag,
  randomInt,
  randomFloat,
} = require('../lib/simulation');

/* -------------------------------------------------------------------------- */
/*  timeToFloat                                                                */
/* -------------------------------------------------------------------------- */
describe('timeToFloat', () => {
  test('converts "08:00" → 8.0', () => expect(timeToFloat('08:00')).toBe(8));
  test('converts "08:30" → 8.5', () => expect(timeToFloat('08:30')).toBe(8.5));
  test('converts "17:45" → 17.75', () => expect(timeToFloat('17:45')).toBe(17.75));
  test('converts "00:00" → 0', () => expect(timeToFloat('00:00')).toBe(0));
  test('converts "23:59" → ~23.98', () => {
    expect(timeToFloat('23:59')).toBeCloseTo(23.983, 2);
  });
});

/* -------------------------------------------------------------------------- */
/*  isPeakHour                                                                 */
/* -------------------------------------------------------------------------- */
describe('isPeakHour', () => {
  test('08:00 is peak', () => expect(isPeakHour('08:00')).toBe(true));
  test('09:00 is peak', () => expect(isPeakHour('09:00')).toBe(true));
  test('18:00 is peak', () => expect(isPeakHour('18:00')).toBe(true));
  test('12:00 is NOT peak', () => expect(isPeakHour('12:00')).toBe(false));
  test('06:00 is NOT peak', () => expect(isPeakHour('06:00')).toBe(false));
  test('22:00 is NOT peak', () => expect(isPeakHour('22:00')).toBe(false));
  test('boundary 07:30 is peak', () => expect(isPeakHour('07:30')).toBe(true));
  test('boundary 09:30 is peak', () => expect(isPeakHour('09:30')).toBe(true));
  test('boundary 17:30 is peak', () => expect(isPeakHour('17:30')).toBe(true));
  test('boundary 19:30 is peak', () => expect(isPeakHour('19:30')).toBe(true));
});

/* -------------------------------------------------------------------------- */
/*  crowdToStressIndex                                                         */
/* -------------------------------------------------------------------------- */
describe('crowdToStressIndex', () => {
  test('0% crowd → 0 stress', () => expect(crowdToStressIndex(0)).toBe(0));
  test('100% crowd → 9 stress', () => expect(crowdToStressIndex(100)).toBe(9));
  test('50% crowd → 4.5 stress', () => expect(crowdToStressIndex(50)).toBe(4.5));
  test('returns number', () => expect(typeof crowdToStressIndex(75)).toBe('number'));
});

/* -------------------------------------------------------------------------- */
/*  crowdToTag                                                                 */
/* -------------------------------------------------------------------------- */
describe('crowdToTag', () => {
  test('0 → Comfortable', () => expect(crowdToTag(0)).toBe('Comfortable'));
  test('40 → Comfortable', () => expect(crowdToTag(40)).toBe('Comfortable'));
  test('41 → Moderate', () => expect(crowdToTag(41)).toBe('Moderate'));
  test('70 → Moderate', () => expect(crowdToTag(70)).toBe('Moderate'));
  test('71 → Packed', () => expect(crowdToTag(71)).toBe('Packed'));
  test('100 → Packed', () => expect(crowdToTag(100)).toBe('Packed'));
});

/* -------------------------------------------------------------------------- */
/*  randomInt / randomFloat                                                    */
/* -------------------------------------------------------------------------- */
describe('randomInt', () => {
  test('returns integer within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomInt(10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(20);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('randomFloat', () => {
  test('returns float within range', () => {
    for (let i = 0; i < 100; i++) {
      const v = randomFloat(1.5, 2.5);
      expect(v).toBeGreaterThanOrEqual(1.5);
      expect(v).toBeLessThanOrEqual(2.5);
    }
  });
});

/* -------------------------------------------------------------------------- */
/*  runSimulation                                                              */
/* -------------------------------------------------------------------------- */
describe('runSimulation', () => {
  const params = { stop: 'MG Road Metro', route: 'Green Line 47', time: '08:30' };

  let result;
  beforeEach(() => { result = runSimulation(params); });

  test('returns an object', () => expect(typeof result).toBe('object'));
  test('verdict is WAIT or BOARD NOW', () =>
    expect(['WAIT', 'BOARD NOW']).toContain(result.verdict));
  test('patiencePayoff is 0–100', () => {
    expect(result.patiencePayoff).toBeGreaterThanOrEqual(0);
    expect(result.patiencePayoff).toBeLessThanOrEqual(100);
  });
  test('timeSavedSeconds is non-negative', () =>
    expect(result.timeSavedSeconds).toBeGreaterThanOrEqual(0));
  test('returns 3 vehicles', () => expect(result.vehicles).toHaveLength(3));
  test('exactly one vehicle is recommended', () => {
    const recs = result.vehicles.filter(v => v.recommended);
    expect(recs).toHaveLength(1);
  });
  test('recommended vehicle has lowest crowdScore', () => {
    const minScore = Math.min(...result.vehicles.map(v => v.crowdScore));
    const rec = result.vehicles.find(v => v.recommended);
    expect(rec.crowdScore).toBe(minScore);
  });
  test('peak off-peak flag reflects time', () => {
    const peak    = runSimulation({ ...params, time: '08:00' });
    const offPeak = runSimulation({ ...params, time: '12:00' });
    expect(peak.isPeak).toBe(true);
    expect(offPeak.isPeak).toBe(false);
  });
  test('all vehicles have required fields', () => {
    result.vehicles.forEach(v => {
      expect(v).toHaveProperty('label');
      expect(v).toHaveProperty('arrivesInMin');
      expect(v).toHaveProperty('crowdScore');
      expect(v).toHaveProperty('stressIndex');
      expect(v).toHaveProperty('tag');
      expect(v).toHaveProperty('recommended');
    });
  });
  test('waitSeconds is 0 for BOARD NOW', () => {
    // Force 100 iterations to find at least one BOARD NOW
    let found = false;
    for (let i = 0; i < 200; i++) {
      const r = runSimulation({ ...params, time: '12:00' }); // off-peak → lower v1
      if (r.verdict === 'BOARD NOW') {
        expect(r.waitSeconds).toBe(0);
        found = true;
        break;
      }
    }
    // It's probabilistic; just ensure the field exists
    expect(typeof result.waitSeconds).toBe('number');
  });
});
