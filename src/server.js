// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const admin = require('firebase-admin');

// --- Firebase Admin (Service Account desde .env) ---
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  PORT = 3000,
  DATABASE_URL = path.join(__dirname, '..', 'data.sqlite'),
} = process.env;

if (!admin.apps.length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[WARN] Credenciales Firebase no encontradas. Revisa tu .env');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Importante: la private key puede venir con \n escapados
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
}

// --- DB: SQLite ---
const db = new sqlite3.Database(DATABASE_URL);
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL
    )`
  );
});

// --- App Express ---
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static (frontend)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// --- Simulated API (Commit helen) ---
try {
  const simRouter = require('./sim/simRouter');
  app.use('/sim', simRouter);
} catch (e) {
  console.warn('[WARN] simRouter no disponible aún:', e.message);
}

// --- Middleware: verificar ID Token de Firebase ---
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Bearer token' });
    if (!admin.apps.length) {
      return res.status(500).json({ error: 'Firebase Admin no inicializado' });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// --- API protegida: /api/products ---
app.get('/api/products', verifyAuth, (req, res) => {
  db.all('SELECT id, name, price FROM products ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows || []);
  });
});

app.post('/api/products', verifyAuth, (req, res) => {
  const { name, price } = req.body || {};
  const n = String(name || '').trim();
  const p = Number(price);
  if (!n || Number.isNaN(p) || p < 0) {
    return res.status(400).json({ error: 'Nombre y precio válidos son requeridos' });
  }
  const stmt = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)');
  stmt.run(n, p, function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ id: this.lastID, name: n, price: p });
  });
  stmt.finalize();
});

// Health básico del server
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// Fallback al index.html (si navegas directo)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sim')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

// --- Arranque condicional ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LoboCaf server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
