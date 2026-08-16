// lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database connection
const db = new Database(path.join(process.cwd(), 'dev.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
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
`);

// Helper function to generate IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}

// Helper function to generate game codes
export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default db;

export type { Game, Player, Citizen, Resource, GameState } from './types';