// tests/sim-api.test.js
const request = require('supertest');
const { createSimApp } = require('../src/sim/createSimApp');

describe('Simulated API', () => {
  const app = createSimApp();

  test('GET /sim/health -> 200 ok', async () => {
    const res = await request(app).get('/sim/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('GET /sim/products -> returns array', async () => {
    const res = await request(app).get('/sim/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /sim/stats -> has metrics', async () => {
    const res = await request(app).get('/sim/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('avg');
    expect(res.body).toHaveProperty('maxPrice');
    expect(res.body).toHaveProperty('maxName');
  });
});
