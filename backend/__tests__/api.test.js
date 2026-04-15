/**
 * @file api.test.js
 * @description Supertest integration tests for the WaitWise Express API.
 */

'use strict';

const request = require('supertest');
const app     = require('../server');

describe('POST /api/analyze', () => {

  const validBody = { stop: 'MG Road Metro', route: 'Green Line 47', time: '08:30' };

  /* ---------------------------------------------------------------------- */
  /*  Happy path                                                              */
  /* ---------------------------------------------------------------------- */
  test('returns 200 with valid body', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(res.status).toBe(200);
  });

  test('response has verdict field', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(['WAIT', 'BOARD NOW']).toContain(res.body.verdict);
  });

  test('response has 3 vehicles', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(res.body.vehicles).toHaveLength(3);
  });

  test('response has reasoning array with 4 items', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(Array.isArray(res.body.reasoning)).toBe(true);
    expect(res.body.reasoning).toHaveLength(4);
  });

  test('patiencePayoff is between 0 and 100', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(res.body.patiencePayoff).toBeGreaterThanOrEqual(0);
    expect(res.body.patiencePayoff).toBeLessThanOrEqual(100);
  });

  test('timeSavedSeconds is non-negative', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(res.body.timeSavedSeconds).toBeGreaterThanOrEqual(0);
  });

  /* ---------------------------------------------------------------------- */
  /*  Input validation                                                        */
  /* ---------------------------------------------------------------------- */
  test('returns 400 when stop is missing', async () => {
    const res = await request(app).post('/api/analyze').send({ route: 'Green Line 47', time: '08:30' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stop/i);
  });

  test('returns 400 when route is missing', async () => {
    const res = await request(app).post('/api/analyze').send({ stop: 'MG Road', time: '08:30' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/route/i);
  });

  test('returns 400 when time is missing', async () => {
    const res = await request(app).post('/api/analyze').send({ stop: 'MG Road', route: 'Green Line' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/time/i);
  });

  test('returns 400 for invalid time format', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ stop: 'MG Road', route: 'Green Line', time: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for time "25:00"', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ stop: 'MG Road', route: 'Green Line', time: '25:00' });
    expect(res.status).toBe(400);
  });

  /* ---------------------------------------------------------------------- */
  /*  Security / content-type                                                 */
  /* ---------------------------------------------------------------------- */
  test('response has X-Content-Type-Options header', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('returns 405 for GET request', async () => {
    const res = await request(app).get('/api/analyze');
    expect([404, 405]).toContain(res.status);
  });

  /* ---------------------------------------------------------------------- */
  /*  Caching                                                                 */
  /* ---------------------------------------------------------------------- */
  test('second request returns X-Cache: HIT', async () => {
    const body = { ...validBody, time: '10:00' }; // unique hour to avoid cross-test cache collision
    await request(app).post('/api/analyze').send(body);           // warm cache
    const res2 = await request(app).post('/api/analyze').send(body);
    expect(res2.headers['x-cache']).toBe('HIT');
  });

  /* ---------------------------------------------------------------------- */
  /*  Vehicle fields                                                          */
  /* ---------------------------------------------------------------------- */
  test('each vehicle has required fields', async () => {
    const res = await request(app).post('/api/analyze').send(validBody);
    res.body.vehicles.forEach(v => {
      expect(v).toHaveProperty('label');
      expect(v).toHaveProperty('arrivesInMin');
      expect(v).toHaveProperty('crowdScore');
      expect(v).toHaveProperty('stressIndex');
      expect(v).toHaveProperty('tag');
      expect(v).toHaveProperty('recommended');
    });
  });

  test('exactly one vehicle is recommended', async () => {
    const res  = await request(app).post('/api/analyze').send(validBody);
    const recs = res.body.vehicles.filter(v => v.recommended);
    expect(recs).toHaveLength(1);
  });
});
