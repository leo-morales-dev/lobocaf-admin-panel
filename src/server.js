// src/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');

const { openDatabase } = require('./db');
const productsRouter = require('./routes/products');
const { ensureFirebaseApp } = require('./middleware/auth');

const { PORT = 3000 } = process.env;

const db = openDatabase();
const firebaseStatus = ensureFirebaseApp();
if (!firebaseStatus.ok) {
  const details = firebaseStatus.error ? firebaseStatus.error.message : 'Credenciales faltantes';
  console.warn('[WARN] Firebase Admin no inicializado al arranque:', details);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

try {
  const simRouter = require('./sim/simRouter');
  app.use('/sim', simRouter);
} catch (error) {
  console.warn('[WARN] simRouter no disponible aún:', error.message);
}

app.use('/api/products', productsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/sim')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LoboCaf server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, db };
