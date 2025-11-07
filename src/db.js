const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');

dotenv.config();

const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data.sqlite');
const dbFile = process.env.DATABASE_URL || DEFAULT_DB_PATH;

let db;

function openDatabase() {
  if (db) {
    return db;
  }

  db = new sqlite3.Database(dbFile);
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL
      )`
    );
  });

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function closeDatabase(callback) {
  if (!db) {
    if (typeof callback === 'function') {
      callback();
    }
    return;
  }

  const current = db;
  db = undefined;
  current.close(callback);
}

module.exports = {
  openDatabase,
  getDb,
  closeDatabase,
};
