'use server'
import db, { generateId, generateCode } from '@/lib/db';
import { Game, Player, Citizen, Resource, GameState, GameMode } from '@/lib/types';
import { LOCATIONS } from '@/lib/locations';
import { revalidatePath } from 'next/cache';
import { getIO } from '@/lib/socketServer';

const VALID_ITEM_TYPES = ['food', 'water', 'medkit', 'ammo', 'scrap'];

function seedLocationLoot(gameId: string) {
  const insertLoot = db.prepare(`
    INSERT INTO location_loot (id, gameId, locationKey, itemType, label, icon) VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const location of LOCATIONS) {
    for (const item of location.lootPool) {
      insertLoot.run(generateId(), gameId, location.key, item.itemType, item.label, item.icon);
    }
  }
}

// ---- LOBBY ACTIONS ----

export async function createGame(playerName: string, mode: GameMode = 'coop') {
  const code = generateCode();
  const gameId = generateId();

  const insertGame = db.prepare(`INSERT INTO games (id, code, mode) VALUES (?, ?, ?)`);
  insertGame.run(gameId, code, mode);

  const insertResources = db.prepare(`INSERT INTO resources (id, gameId) VALUES (?, ?)`);
  insertResources.run(generateId(), gameId);

  const insertCitizen = db.prepare(`INSERT INTO citizens (id, gameId, citizenNumber) VALUES (?, ?, ?)`);
  for (let i = 1; i <= 10; i++) {
    insertCitizen.run(generateId(), gameId, i);
  }

  const playerId = generateId();
  const insertPlayer = db.prepare(`INSERT INTO players (id, gameId, name, isHost) VALUES (?, ?, ?, ?)`);
  insertPlayer.run(playerId, gameId, playerName, 1);

  seedLocationLoot(gameId);

  return { gameCode: code, playerId };
}

export async function joinGame(code: string, playerName: string) {
  const getGame = db.prepare(`SELECT * FROM games WHERE code = ?`);
  const game = getGame.get(code) as Game | undefined;

  if (!game) throw new Error('Game not found');
  if (game.status !== 'waiting') throw new Error('Game already started');

  const countPlayers = db.prepare(`SELECT COUNT(*) as count FROM players WHERE gameId = ?`);
  const result = countPlayers.get(game.id) as { count: number };
  if (result.count >= 8) throw new Error('Game is full');

  const playerId = generateId();
  const insertPlayer = db.prepare(`INSERT INTO players (id, gameId, name) VALUES (?, ?, ?)`);
  insertPlayer.run(playerId, game.id, playerName);

  getIO()?.to(code).emit('player-joined', { code, name: playerName });

  return { gameCode: code, playerId };
}

export async function getGameState(code: string, viewerPlayerId?: string): Promise<GameState | null> {
  const getGame = db.prepare(`SELECT * FROM games WHERE code = ?`);
  const game = getGame.get(code) as Game | undefined;
  if (!game) return null;

  const getPlayers = db.prepare(`SELECT id, gameId, name, role, isHost, health, isAlive FROM players WHERE gameId = ?`);
  const players = getPlayers.all(game.id) as Player[];

  const getCitizens = db.prepare(`
    SELECT id, citizenNumber, health, hasFood, hasWater FROM citizens 
    WHERE gameId = ? ORDER BY citizenNumber ASC
  `);
  const citizens = getCitizens.all(game.id) as Citizen[];

  const getResources = db.prepare(`SELECT food, water, medkit, ammo, scrap FROM resources WHERE gameId = ?`);
  const resources = getResources.get(game.id) as Resource;

  const getLootCounts = db.prepare(`
    SELECT locationKey, COUNT(*) as count FROM location_loot WHERE gameId = ? GROUP BY locationKey
  `);
  const lootRows = getLootCounts.all(game.id) as { locationKey: string; count: number }[];
  const locationLootCounts: Record<string, number> = {};
  for (const row of lootRows) locationLootCounts[row.locationKey] = row.count;

  let inventory: GameState['inventory'] = [];
  if (viewerPlayerId) {
    const getInventory = db.prepare(`
      SELECT id, gameId, playerId, itemType, label, icon FROM inventory_items WHERE gameId = ? AND playerId = ?
    `);
    inventory = getInventory.all(game.id, viewerPlayerId) as GameState['inventory'];
  }

  return { ...game, players, citizens, resources, inventory, locationLootCounts };
}

// ---- EXPLORATION ACTIONS ----

export async function exploreLocation(code: string, playerId: string, locationKey: string) {
  const getGame = db.prepare(`SELECT id FROM games WHERE code = ?`);
  const game = getGame.get(code) as { id: string } | undefined;
  if (!game) throw new Error('Game not found');

  const getLoot = db.prepare(`SELECT id, itemType, label, icon FROM location_loot WHERE gameId = ? AND locationKey = ?`);
  const pool = getLoot.all(game.id, locationKey) as { id: string; itemType: string; label: string; icon: string }[];

  if (pool.length === 0) throw new Error('This location has been picked clean.');

  const found = pool[Math.floor(Math.random() * pool.length)];

  db.prepare(`DELETE FROM location_loot WHERE id = ?`).run(found.id);
  db.prepare(`
    INSERT INTO inventory_items (id, gameId, playerId, itemType, label, icon) VALUES (?, ?, ?, ?, ?, ?)
  `).run(generateId(), game.id, playerId, found.itemType, found.label, found.icon);

  getIO()?.to(code).emit('inventory-updated', { code });

  revalidatePath(`/game/${code}`);
  revalidatePath(`/game/${code}/explore/${locationKey}`);

  return { label: found.label, icon: found.icon, itemType: found.itemType };
}

export async function depositInventoryItem(code: string, playerId: string, inventoryItemId: string) {
  const getGame = db.prepare(`SELECT id, mode FROM games WHERE code = ?`);
  const game = getGame.get(code) as { id: string; mode: string } | undefined;
  if (!game) throw new Error('Game not found');
  if (game.mode !== 'coop') throw new Error('Shared stockpile is only available in Coop mode');

  const getItem = db.prepare(`SELECT id, itemType FROM inventory_items WHERE id = ? AND playerId = ?`);
  const item = getItem.get(inventoryItemId, playerId) as { id: string; itemType: string } | undefined;
  if (!item) throw new Error('Item not found in your inventory');
  if (!VALID_ITEM_TYPES.includes(item.itemType)) throw new Error('Invalid item type');

  db.prepare(`DELETE FROM inventory_items WHERE id = ?`).run(item.id);
  db.prepare(`UPDATE resources SET ${item.itemType} = ${item.itemType} + 1 WHERE gameId = ?`).run(game.id);

  getIO()?.to(code).emit('inventory-updated', { code });
  getIO()?.to(code).emit('resource-updated', { code, type: item.itemType, amount: 1 });

  revalidatePath(`/game/${code}`);
}

export async function useInventoryItem(code: string, playerId: string, inventoryItemId: string) {
  const getGame = db.prepare(`SELECT id FROM games WHERE code = ?`);
  const game = getGame.get(code) as { id: string } | undefined;
  if (!game) throw new Error('Game not found');

  const getItem = db.prepare(`SELECT id, itemType FROM inventory_items WHERE id = ? AND playerId = ?`);
  const item = getItem.get(inventoryItemId, playerId) as { id: string; itemType: string } | undefined;
  if (!item) throw new Error('Item not found in your inventory');

  db.prepare(`DELETE FROM inventory_items WHERE id = ?`).run(item.id);

  let healthGain = 0;
  if (item.itemType === 'medkit') healthGain = 30;
  else if (item.itemType === 'food' || item.itemType === 'water') healthGain = 10;

  if (healthGain > 0) {
    db.prepare(`UPDATE players SET health = MIN(100, health + ?) WHERE id = ?`).run(healthGain, playerId);
  }

  getIO()?.to(code).emit('inventory-updated', { code });

  revalidatePath(`/game/${code}`);
}

// ---- GAME ACTIONS ----

export async function depositResource(code: string, type: 'food'|'water'|'medkit'|'ammo'|'scrap') {
  const getGame = db.prepare(`SELECT id, phase, mode FROM games WHERE code = ?`);
  const game = getGame.get(code) as { id: string; phase: string; mode: string } | undefined;
  if (!game) throw new Error('Game not found');
  if (game.mode !== 'coop') throw new Error('Shared stockpile is only available in Coop mode');
  if (game.phase !== 'Day') throw new Error('Cannot deposit at night');

  db.prepare(`UPDATE resources SET ${type} = ${type} + 1 WHERE gameId = ?`).run(game.id);

  getIO()?.to(code).emit('resource-updated', { code, type, amount: 1 });

  revalidatePath(`/game/${code}`);
}

export async function useMedkit(code: string, citizenId: string) {
  const getGameResources = db.prepare(`
    SELECT g.id as gameId, r.medkit FROM games g JOIN resources r ON r.gameId = g.id WHERE g.code = ?
  `);
  const result = getGameResources.get(code) as { gameId: string; medkit: number } | undefined;
  if (!result || result.medkit <= 0) throw new Error('No medkits available');

  db.prepare(`UPDATE resources SET medkit = medkit - 1 WHERE gameId = ?`).run(result.gameId);
  db.prepare(`UPDATE citizens SET health = MIN(100, health + 30) WHERE id = ?`).run(citizenId);

  getIO()?.to(code).emit('citizen-updated', { code });

  revalidatePath(`/game/${code}`);
}

export async function advanceNight(code: string) {
  const getGameData = db.prepare(`
    SELECT g.id as gameId, g.mode, g.nightCount, r.food, r.water 
    FROM games g JOIN resources r ON r.gameId = g.id WHERE g.code = ?
  `);
  const gameData = getGameData.get(code) as {
    gameId: string; mode: string; nightCount: number; food: number; water: number;
  } | undefined;

  if (!gameData) throw new Error('Game not found');

  let gameEnded = false;

  if (gameData.mode === 'versus') {
    const getPlayers = db.prepare(`SELECT id, health, isAlive FROM players WHERE gameId = ?`);
    const players = getPlayers.all(gameData.gameId) as { id: string; health: number; isAlive: number }[];

    const updatePlayer = db.prepare(`UPDATE players SET health = ?, isAlive = ? WHERE id = ?`);
    const getOneItem = db.prepare(`SELECT id FROM inventory_items WHERE playerId = ? AND itemType = ? LIMIT 1`);
    const deleteItem = db.prepare(`DELETE FROM inventory_items WHERE id = ?`);

    for (const p of players) {
      if (!p.isAlive) continue;
      let healthDrop = 0;

      const foodItem = getOneItem.get(p.id, 'food') as { id: string } | undefined;
      if (foodItem) deleteItem.run(foodItem.id); else healthDrop -= 15;

      const waterItem = getOneItem.get(p.id, 'water') as { id: string } | undefined;
      if (waterItem) deleteItem.run(waterItem.id); else healthDrop -= 20;

      const newHealth = Math.max(0, p.health + healthDrop);
      updatePlayer.run(newHealth, newHealth > 0 ? 1 : 0, p.id);
    }

    const getAliveCount = db.prepare(`SELECT COUNT(*) as count FROM players WHERE gameId = ? AND isAlive = 1`);
    const { count } = getAliveCount.get(gameData.gameId) as { count: number };
    gameEnded = count <= 1;
  } else {
    const getCitizens = db.prepare(`SELECT id, health FROM citizens WHERE gameId = ?`);
    const citizens = getCitizens.all(gameData.gameId) as { id: string; health: number }[];

    let newFood = gameData.food;
    let newWater = gameData.water;
    let allDead = true;

    const updateCitizen = db.prepare(`UPDATE citizens SET health = ?, hasFood = ?, hasWater = ? WHERE id = ?`);

    for (const c of citizens) {
      let healthDrop = 0;
      let hasFood = 0;
      let hasWater = 0;

      if (newFood > 0) { newFood--; hasFood = 1; } else { healthDrop -= 20; }
      if (newWater > 0) { newWater--; hasWater = 1; } else { healthDrop -= 30; }

      const newHealth = Math.max(0, c.health + healthDrop);
      updateCitizen.run(newHealth, hasFood, hasWater, c.id);
      if (newHealth > 0) allDead = false;
    }

    db.prepare(`UPDATE resources SET food = ?, water = ? WHERE gameId = ?`).run(newFood, newWater, gameData.gameId);
    gameEnded = allDead;
  }

  db.prepare(`
    UPDATE games SET phase = 'Night', nightCount = nightCount + 1, status = ? WHERE id = ?
  `).run(gameEnded ? 'ended' : 'playing', gameData.gameId);

  getIO()?.to(code).emit('night-advanced', { code });

  revalidatePath(`/game/${code}`);
}

export async function advanceDay(code: string) {
  db.prepare(`UPDATE games SET phase = 'Day' WHERE code = ?`).run(code);

  getIO()?.to(code).emit('day-started', { code });

  revalidatePath(`/game/${code}`);
}

export async function startGame(code: string) {
  const getGameInfo = db.prepare(`SELECT id, mode FROM games WHERE code = ?`);
  const gameInfo = getGameInfo.get(code) as { id: string; mode: string } | undefined;
  if (!gameInfo) throw new Error('Game not found');

  const getPlayers = db.prepare(`SELECT id FROM players WHERE gameId = ?`);
  const players = getPlayers.all(gameInfo.id) as { id: string }[];
  if (players.length === 0) throw new Error('No players found');

  const updatePlayerRole = db.prepare(`UPDATE players SET role = ? WHERE id = ?`);

  if (gameInfo.mode === 'coop') {
    const allRoles = [
      'Commander','Scout','Quartermaster','Field Medic','Engineer',
      'Sniper','Hydrologist','Chef','Scavenger','Tinkerer','Brawler','Diplomat'
    ];
    const shuffled = allRoles.sort(() => 0.5 - Math.random());
    players.forEach((p, i) => updatePlayerRole.run(shuffled[i % shuffled.length], p.id));
  } else {
    players.forEach((p) => updatePlayerRole.run('Survivor', p.id));
  }

  db.prepare(`UPDATE games SET status = 'playing' WHERE id = ?`).run(gameInfo.id);

  getIO()?.to(code).emit('game-started', { code });

  revalidatePath(`/game/${code}`);
}