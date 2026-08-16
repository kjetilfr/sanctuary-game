// lib/types.ts

export interface Game {
  id: string;
  code: string;
  phase: 'Day' | 'Night';
  nightCount: number;
  status: 'waiting' | 'playing' | 'ended';
  createdAt: string;
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  role: string | null;
  isHost: number; // 0 or 1
  createdAt: string;
}

export interface Citizen {
  id: string;
  gameId: string;
  citizenNumber: number;
  health: number;
  hasFood: number; // 0 or 1
  hasWater: number; // 0 or 1
}

export interface Resource {
  id: string;
  gameId: string;
  food: number;
  water: number;
  medkit: number;
  ammo: number;
  scrap: number;
}

// Response types for getGameState
export interface GameState {
  id: string;
  code: string;
  phase: 'Day' | 'Night';
  nightCount: number;
  status: 'waiting' | 'playing' | 'ended';
  createdAt: string;
  players: Player[];
  citizens: Citizen[];
  resources: Resource;
}