
import { Router } from 'express';
import { getDb } from '../db.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();

// All product routes require auth
router.use(verifyAuth);

router.get('/', (req, res) => {
  const db = getDb();
  db.all('SELECT id, name, price FROM products ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { name, price } = req.body;
  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'name (string) and price (number) are required' });
  }
  const db = getDb();
  db.run('INSERT INTO products(name, price) VALUES(?,?)', [name, price], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, price });
  });
});

export default router;
