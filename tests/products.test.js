// tests/products.test.js
const request = require('supertest');

// Mock de firebase-admin para que verifyIdToken siempre “valide”
jest.mock('firebase-admin', () => {
  const auth = () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' })
  });
  return {
    apps: [{}],                 // Simula que ya hay una app inicializada
    auth,
    credential: { cert: jest.fn() }
  };
});

const { app, db } = require('../src/server');

beforeAll((done) => {
  // Asegura tabla y limpia antes de comenzar
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      )`,
      () => {
        db.run('DELETE FROM products', done);
      }
    );
  });
});

afterAll((done) => {
  // Cierra la DB al terminar
  db.close(done);
});

describe('Protected /api/products', () => {
  const authHeader = { Authorization: 'Bearer fake-token' };

  test('GET /api/products -> 200 [] cuando está vacío', async () => {
    const res = await request(app)
      .get('/api/products')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('POST /api/products -> 201 crea un producto válido', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(authHeader)
      .send({ name: 'Capuchino test', price: 42.5 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ name: 'Capuchino test', price: 42.5 });
  });

  test('GET /api/products -> 200 con 1 elemento después del POST', async () => {
    const res = await request(app)
      .get('/api/products')
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({ name: 'Capuchino test', price: 42.5 });
  });

  test('POST /api/products -> 400 si falta nombre o precio inválido', async () => {
    const res = await request(app)
      .post('/api/products')
      .set(authHeader)
      .send({ name: '', price: -10 });

    expect(res.status).toBe(400);
  });
});
