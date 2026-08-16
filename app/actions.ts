'use server'
import db, { generateId, generateCode } from '@/lib/db';
import { Game, Player, Citizen, Resource, GameState } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getSocket } from '@/lib/socket';

// ---- LOBBY ACTIONS ----

export async function createGame(playerName: string) {
  const code = generateCode();
  const gameId = generateId();
  
  // Create game
  const insertGame = db.prepare(`
    INSERT INTO games (id, code) VALUES (?, ?)
  `);
  insertGame.run(gameId, code);
  
  // Create resources
  const insertResources = db.prepare(`
    INSERT INTO resources (id, gameId) VALUES (?, ?)
  `);
  insertResources.run(generateId(), gameId);
  
  // Create 10 citizens
  const insertCitizen = db.prepare(`
    INSERT INTO citizens (id, gameId, citizenNumber) VALUES (?, ?, ?)
  `);
  for (let i = 1; i <= 10; i++) {
    insertCitizen.run(generateId(), gameId, i);
  }
  
  // Create host player
  const insertPlayer = db.prepare(`
    INSERT INTO players (id, gameId, name, isHost) VALUES (?, ?, ?, ?)
  `);
  insertPlayer.run(generateId(), gameId, playerName, 1);
  
  return { gameCode: code };
}

export async function joinGame(code: string, playerName: string) {
  // Get game by code
  const getGame = db.prepare(`
    SELECT * FROM games WHERE code = ?
  `);
  const game = getGame.get(code) as Game | undefined;
  
  if (!game) throw new Error('Game not found');
  if (game.status !== 'waiting') throw new Error('Game already started');
  
  // Count players
  const countPlayers = db.prepare(`
    SELECT COUNT(*) as count FROM players WHERE gameId = ?
  `);
  const result = countPlayers.get(game.id) as { count: number };
  if (result.count >= 8) throw new Error('Game is full');
  
  // Add player
  const insertPlayer = db.prepare(`
    INSERT INTO players (id, gameId, name) VALUES (?, ?, ?)
  `);
  insertPlayer.run(generateId(), game.id, playerName);
  
  // Notify other players via WebSocket
  const socket = getSocket();
  socket.emit('player-joined', { code, name: playerName });
  
  return { gameCode: code };
}

export async function getGameState(code: string): Promise<GameState | null> {
  // Get game
  const getGame = db.prepare(`
    SELECT * FROM games WHERE code = ?
  `);
  const game = getGame.get(code) as Game | undefined;
  if (!game) return null;
  
  // Get players
  const getPlayers = db.prepare(`
    SELECT id, name, role, isHost FROM players WHERE gameId = ?
  `);
  const players = getPlayers.all(game.id) as Player[];
  
  // Get citizens
  const getCitizens = db.prepare(`
    SELECT id, citizenNumber, health, hasFood, hasWater FROM citizens 
    WHERE gameId = ? ORDER BY citizenNumber ASC
  `);
  const citizens = getCitizens.all(game.id) as Citizen[];
  
  // Get resources
  const getResources = db.prepare(`
    SELECT food, water, medkit, ammo, scrap FROM resources WHERE gameId = ?
  `);
  const resources = getResources.get(game.id) as Resource;
  
  return {
    ...game,
    players,
    citizens,
    resources
  };
}

// ---- GAME ACTIONS ----

export async function depositResource(code: string, type: 'food'|'water'|'medkit'|'ammo'|'scrap') {
  // Get game ID
  const getGame = db.prepare(`
    SELECT id, phase FROM games WHERE code = ?
  `);
  const game = getGame.get(code) as { id: string; phase: string } | undefined;
  if (game?.phase !== 'Day') throw new Error('Cannot deposit at night');
  
  // Update resource
  const updateResource = db.prepare(`
    UPDATE resources SET ${type} = ${type} + 1 WHERE gameId = ?
  `);
  updateResource.run(game.id);
  
  const socket = getSocket();
  socket.emit('resource-updated', { code, type, amount: 1 });
  
  revalidatePath(`/game/${code}`);
}

export async function useMedkit(code: string, citizenId: string) {
  // Get game ID and check resources
  const getGameResources = db.prepare(`
    SELECT g.id as gameId, r.medkit 
    FROM games g 
    JOIN resources r ON r.gameId = g.id 
    WHERE g.code = ?
  `);
  const result = getGameResources.get(code) as { gameId: string; medkit: number } | undefined;
  if (!result || result.medkit <= 0) throw new Error('No medkits available');
  
  // Decrease medkit
  const updateMedkit = db.prepare(`
    UPDATE resources SET medkit = medkit - 1 WHERE gameId = ?
  `);
  updateMedkit.run(result.gameId);
  
  // Increase citizen health
  const updateHealth = db.prepare(`
    UPDATE citizens SET health = MIN(100, health + 30) WHERE id = ?
  `);
  updateHealth.run(citizenId);
  
  const socket = getSocket();
  socket.emit('citizen-updated', { code });
  
  revalidatePath(`/game/${code}`);
}

export async function advanceNight(code: string) {
  // Get game data
  const getGameData = db.prepare(`
    SELECT g.id as gameId, g.nightCount, r.food, r.water 
    FROM games g 
    JOIN resources r ON r.gameId = g.id 
    WHERE g.code = ?
  `);
  const gameData = getGameData.get(code) as { 
    gameId: string; 
    nightCount: number; 
    food: number; 
    water: number;
  } | undefined;
  
  if (!gameData) throw new Error('Game not found');
  
  // Get citizens
  const getCitizens = db.prepare(`
    SELECT id, health FROM citizens WHERE gameId = ?
  `);
  const citizens = getCitizens.all(gameData.gameId) as { id: string; health: number }[];
  
  let newFood = gameData.food;
  let newWater = gameData.water;
  let allDead = true;
  
  // Update each citizen
  const updateCitizen = db.prepare(`
    UPDATE citizens 
    SET health = ?, hasFood = ?, hasWater = ? 
    WHERE id = ?
  `);
  
  for (const c of citizens) {
    let healthDrop = 0;
    let hasFood = 0;
    let hasWater = 0;
    
    if (newFood > 0) {
      newFood--;
      hasFood = 1;
    } else {
      healthDrop -= 20;
    }
    
    if (newWater > 0) {
      newWater--;
      hasWater = 1;
    } else {
      healthDrop -= 30;
    }
    
    const newHealth = Math.max(0, c.health + healthDrop);
    updateCitizen.run(newHealth, hasFood, hasWater, c.id);
    
    if (newHealth > 0) allDead = false;
  }
  
  // Update resources
  const updateResources = db.prepare(`
    UPDATE resources SET food = ?, water = ? WHERE gameId = ?
  `);
  updateResources.run(newFood, newWater, gameData.gameId);
  
  // Update game phase
  const updateGame = db.prepare(`
    UPDATE games 
    SET phase = 'Night', nightCount = nightCount + 1, status = ?
    WHERE id = ?
  `);
  updateGame.run(allDead ? 'ended' : 'playing', gameData.gameId);
  
  const socket = getSocket();
  socket.emit('night-advanced', { code });
  
  revalidatePath(`/game/${code}`);
}

export async function advanceDay(code: string) {
  const updateGame = db.prepare(`
    UPDATE games SET phase = 'Day' WHERE code = ?
  `);
  updateGame.run(code);
  
  const socket = getSocket();
  socket.emit('day-started', { code });
  
  revalidatePath(`/game/${code}`);
}

export async function startGame(code: string) {
  // Get game ID and players
  const getGamePlayers = db.prepare(`
    SELECT g.id as gameId, p.id as playerId 
    FROM games g 
    JOIN players p ON p.gameId = g.id 
    WHERE g.code = ?
  `);
  const players = getGamePlayers.all(code) as { gameId: string; playerId: string }[];
  
  if (players.length === 0) throw new Error('No players found');
  
  // Assign roles (12 roles, random distribution)
  const allRoles = [
    'Commander','Scout','Quartermaster','Field Medic','Engineer',
    'Sniper','Hydrologist','Chef','Scavenger','Tinkerer','Brawler','Diplomat'
  ];
  const shuffled = allRoles.sort(() => 0.5 - Math.random());
  
  // Update players with roles
  const updatePlayerRole = db.prepare(`
    UPDATE players SET role = ? WHERE id = ?
  `);
  
  for (let i = 0; i < players.length; i++) {
    updatePlayerRole.run(shuffled[i % shuffled.length], players[i].playerId);
  }
  
  // Update game status
  const updateGame = db.prepare(`
    UPDATE games SET status = 'playing' WHERE id = ?
  `);
  updateGame.run(players[0].gameId);
  
  const socket = getSocket();
  socket.emit('game-started', { code });
  
  revalidatePath(`/game/${code}`);
}