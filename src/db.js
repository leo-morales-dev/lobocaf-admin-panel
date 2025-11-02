
import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = process.env.DATABASE_URL || path.join(__dirname, '..', 'data.sqlite');

let db;

export function initDb() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbFile, (err) => {
      if (err) return reject(err);
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      )`, (e) => e ? reject(e) : resolve());
    });
  });
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}
