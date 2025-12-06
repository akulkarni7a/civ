import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read from the data directory
    const filePath = path.join(process.cwd(), 'data', 'gamestate.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const gameState = JSON.parse(fileContents);

    return NextResponse.json(gameState);
  } catch (error) {
    console.error('Error reading game state:', error);

    // Return a default game state for development
    return NextResponse.json({
      gameId: 'dev_game_001',
      turn: 1,
      currentTribe: 'RED',
      status: 'IN_PROGRESS',
      map: {
        width: 20,
        height: 20,
        tiles: generateDefaultTiles(20, 20),
      },
      tribes: {
        RED: { gold: 100, alive: true },
        BLUE: { gold: 100, alive: true },
        GREEN: { gold: 100, alive: true },
        YELLOW: { gold: 100, alive: true },
      },
      units: [
        { id: 1, tribe: 'RED', type: 'KNIGHT', position: [1, 1], canAct: true },
        { id: 2, tribe: 'BLUE', type: 'KNIGHT', position: [18, 1], canAct: false },
        { id: 3, tribe: 'GREEN', type: 'KNIGHT', position: [1, 18], canAct: false },
        { id: 4, tribe: 'YELLOW', type: 'KNIGHT', position: [18, 18], canAct: false },
      ],
      buildings: [
        { id: 1, tribe: 'RED', type: 'CASTLE', position: [0, 0], hp: 10 },
        { id: 2, tribe: 'BLUE', type: 'CASTLE', position: [19, 0], hp: 10 },
        { id: 3, tribe: 'GREEN', type: 'CASTLE', position: [0, 19], hp: 10 },
        { id: 4, tribe: 'YELLOW', type: 'CASTLE', position: [19, 19], hp: 10 },
      ],
      goldMines: [
        { id: 1, position: [5, 5], workerId: null },
        { id: 2, position: [14, 5], workerId: null },
        { id: 3, position: [5, 14], workerId: null },
        { id: 4, position: [14, 14], workerId: null },
        { id: 5, position: [9, 9], workerId: null },
        { id: 6, position: [10, 10], workerId: null },
      ],
      history: [],
    });
  }
}

function generateDefaultTiles(width: number, height: number) {
  const tiles = [];
  const goldMinePositions = new Set(['5,5', '14,5', '5,14', '14,14', '9,9', '10,10']);

  // Starting positions for tribes (corners)
  const startingPositions = {
    RED: { q: 0, r: 0 },
    BLUE: { q: 19, r: 0 },
    GREEN: { q: 0, r: 19 },
    YELLOW: { q: 19, r: 19 },
  };

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      let terrain = 'GRASS';
      let owner = null;

      const key = `${q},${r}`;

      // Check if gold mine
      if (goldMinePositions.has(key)) {
        terrain = 'GOLD_MINE';
      }
      // Random forests and mountains
      else if (Math.random() < 0.15) {
        terrain = 'FOREST';
      } else if (Math.random() < 0.05) {
        terrain = 'MOUNTAIN';
      }

      // Check ownership (tiles around starting positions)
      for (const [tribe, pos] of Object.entries(startingPositions)) {
        const distance = Math.max(Math.abs(q - pos.q), Math.abs(r - pos.r));
        if (distance <= 2) {
          owner = tribe;
          // Don't put mountains/forests in starting areas
          if (terrain === 'MOUNTAIN' || terrain === 'FOREST') {
            terrain = 'GRASS';
          }
        }
      }

      tiles.push({ q, r, terrain, owner });
    }
  }

  return tiles;
}
