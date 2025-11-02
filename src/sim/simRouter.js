// src/sim/simRouter.js
const express = require('express');
const router = express.Router();

// ------------------------------
//  Perillas de simulación (ENV)
// ------------------------------
const SIM_DELAY_MS = Number(process.env.SIM_DELAY_MS || 0);        // p.ej. 400
const SIM_ERROR_RATE_RAW = Number(process.env.SIM_ERROR_RATE || 0); // 0..1
const SIM_ERROR_RATE = Math.min(1, Math.max(0, SIM_ERROR_RATE_RAW));

// Middleware: latencia artificial + error aleatorio
router.use(async (_req, res, next) => {
  // Latencia
  if (SIM_DELAY_MS > 0) {
    await new Promise(r => setTimeout(r, SIM_DELAY_MS));
  }
  // Error aleatorio
  if (SIM_ERROR_RATE > 0 && Math.random() < SIM_ERROR_RATE) {
    return res.status(503).json({ error: 'Simulated service unavailable' });
  }
  next();
});

// ------------------------------
//  Datos mock
// ------------------------------
const MOCK_PRODUCTS = [
  { id: 1, name: 'Capuchino', price: 35.0 },
  { id: 2, name: 'Latte',     price: 33.0 },
  { id: 3, name: 'Americano', price: 28.5 },
];

// ------------------------------
//  Endpoints simulados
// ------------------------------
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    delayMs: SIM_DELAY_MS,
    errorRate: SIM_ERROR_RATE,
  });
});

router.get('/products', (_req, res) => {
  res.json(MOCK_PRODUCTS);
});

router.get('/stats', (_req, res) => {
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
