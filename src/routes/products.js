const express = require('express');
const { getDb } = require('../db');
const { verifyAuth } = require('../middleware/auth');

const router = express.Router();

router.use(verifyAuth);

router.get('/', (_req, res) => {
  const db = getDb();
  db.all('SELECT id, name, price FROM products ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(rows || []);
  });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, price } = req.body || {};
  const n = typeof name === 'string' ? name.trim() : '';
  const p = Number(price);

  if (!n || Number.isNaN(p) || p < 0) {
    return res.status(400).json({ error: 'Nombre y precio válidos son requeridos' });
  }

  const stmt = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)');
  stmt.run(n, p, function runCallback(err) {
    if (err) {
      return res.status(500).json({ error: 'DB error' });
    }
    res.status(201).json({ id: this.lastID, name: n, price: p });
  });
  stmt.finalize();
});

module.exports = router;
