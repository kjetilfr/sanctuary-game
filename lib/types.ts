// lib/types.ts

export type GameMode = 'coop' | 'versus'
export type ItemType = 'food' | 'water' | 'medkit' | 'ammo' | 'scrap'

export interface Game {
  id: string;
  code: string;
  mode: GameMode;
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
  isHost: number;
  health: number;
  isAlive: number;
  createdAt: string;
}

export interface Citizen {
  id: string;
  gameId: string;
  citizenNumber: number;
  health: number;
  hasFood: number;
  hasWater: number;
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

export interface InventoryItem {
  id: string;
  gameId: string;
  playerId: string;
  itemType: ItemType;
  label: string;
  icon: string;
}

export interface GameState {
  id: string;
  code: string;
  mode: GameMode;
  phase: 'Day' | 'Night';
  nightCount: number;
  status: 'waiting' | 'playing' | 'ended';
  createdAt: string;
  players: Player[];
  citizens: Citizen[];
  resources: Resource;
  inventory: InventoryItem[];
  locationLootCounts: Record<string, number>;
}