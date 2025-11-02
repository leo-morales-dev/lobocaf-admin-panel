// src/sim/simRouter.js
const express = require('express');
const router = express.Router();

// Mock data (podrás ajustarlo luego)
const MOCK_PRODUCTS = [
  { id: 1, name: 'Capuchino', price: 35.0 },
  { id: 2, name: 'Latte',     price: 33.0 },
  { id: 3, name: 'Americano', price: 28.5 },
];

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/products', (req, res) => {
  res.json(MOCK_PRODUCTS);
});

router.get('/stats', (req, res) => {
  const total = MOCK_PRODUCTS.length;
  const sum = MOCK_PRODUCTS.reduce((a, p) => a + Number(p.price || 0), 0);
  const avg = total ? sum / total : 0;
  const max = MOCK_PRODUCTS.reduce(
    (m, p) => (Number(p.price) > m.price ? { price: Number(p.price), name: p.name } : m),
    { price: 0, name: '—' }
  );
  res.json({
    total,
    avg,
    maxPrice: max.price,
    maxName: max.name,
  });
});

module.exports = router;
