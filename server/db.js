import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPromise = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, 'gratitude.db'),
      driver: sqlite3.Database
    }).then(async (db) => {
      // Create tables if they do not exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          age INTEGER,
          gender TEXT
        );
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          text TEXT,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
      `);

      // Migration for existing tables
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN age INTEGER;`);
      } catch (e) { /* column exists */ }
      try {
        await db.exec(`ALTER TABLE users ADD COLUMN gender TEXT;`);
      } catch (e) { /* column exists */ }

      return db;
    });
  }
  return dbPromise;
}
