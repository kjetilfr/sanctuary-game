// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'dev.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    mode TEXT DEFAULT 'coop',
    phase TEXT DEFAULT 'Day',
    nightCount INTEGER DEFAULT 1,
    status TEXT DEFAULT 'waiting',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT,
    isHost INTEGER DEFAULT 0,
    health INTEGER DEFAULT 100,
    isAlive INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS citizens (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    citizenNumber INTEGER NOT NULL,
    health INTEGER DEFAULT 100,
    hasFood INTEGER DEFAULT 0,
    hasWater INTEGER DEFAULT 0,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    gameId TEXT UNIQUE NOT NULL,
    food INTEGER DEFAULT 0,
    water INTEGER DEFAULT 0,
    medkit INTEGER DEFAULT 0,
    ammo INTEGER DEFAULT 0,
    scrap INTEGER DEFAULT 0,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS location_loot (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    locationKey TEXT NOT NULL,
    itemType TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    gameId TEXT NOT NULL,
    playerId TEXT NOT NULL,
    itemType TEXT NOT NULL,
    label TEXT NOT NULL,
    icon TEXT NOT NULL,
    FOREIGN KEY (gameId) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (playerId) REFERENCES players(id) ON DELETE CASCADE
  );
`);

// Migrations for databases created before this update — safe to run every startup.
const migrations = [
  `ALTER TABLE games ADD COLUMN mode TEXT DEFAULT 'coop'`,
  `ALTER TABLE players ADD COLUMN health INTEGER DEFAULT 100`,
  `ALTER TABLE players ADD COLUMN isAlive INTEGER DEFAULT 1`,
];
for (const sql of migrations) {
  try { db.exec(sql); } catch { /* column already exists, ignore */ }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default db;

export type { Game, Player, Citizen, Resource, GameState, InventoryItem, GameMode } from './types';