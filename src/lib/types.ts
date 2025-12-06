/**
 * Core game types for Git-vilization
 */

export type TribeColor = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export type TerrainType = 'GRASS' | 'FOREST' | 'MOUNTAIN' | 'WATER' | 'GOLD_MINE';

export type UnitType = 'WORKER' | 'SETTLER' | 'WARRIOR' | 'ARCHER' | 'KNIGHT';

export type BuildingType = 'CASTLE' | 'BARRACKS' | 'TOWER' | 'WALL';

export type ActionType = 'MOVE' | 'ATTACK' | 'BUILD' | 'TRAIN' | 'HARVEST' | 'SETTLE';

export type GameStatus = 'LOBBY' | 'IN_PROGRESS' | 'FINISHED';

export interface HexPosition {
  q: number;
  r: number;
}

export interface Tile {
  q: number;
  r: number;
  terrain: TerrainType;
  owner: TribeColor | null;
}

export interface TribeState {
  gold: number;
  alive: boolean;
}

export interface Unit {
  id: number;
  tribe: TribeColor;
  type: UnitType;
  position: [number, number]; // [q, r]
  canAct: boolean;
  harvesting?: number; // mine_id if harvesting
}

export interface Building {
  id: number;
  tribe: TribeColor;
  type: BuildingType;
  position: [number, number]; // [q, r]
  hp: number;
}

export interface GoldMine {
  id: number;
  position: [number, number]; // [q, r]
  workerId: number | null;
}

export interface GameAction {
  turn: number;
  tribe: TribeColor;
  action: ActionType;
  details: Record<string, unknown>;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Tile[];
}

export interface GameState {
  gameId: string;
  turn: number;
  currentTribe: TribeColor;
  status: GameStatus;
  map: GameMap;
  tribes: Record<TribeColor, TribeState>;
  units: Unit[];
  buildings: Building[];
  goldMines: GoldMine[];
  history: GameAction[];
}

// Action payloads
export interface MoveAction {
  action: 'MOVE';
  unitId: number;
  target: [number, number];
}

export interface AttackAction {
  action: 'ATTACK';
  unitId: number;
  targetId: number;
}

export interface BuildAction {
  action: 'BUILD';
  building: BuildingType;
  position: [number, number];
}

export interface TrainAction {
  action: 'TRAIN';
  unitType: UnitType;
  buildingId: number;
}

export interface HarvestAction {
  action: 'HARVEST';
  unitId: number;
  mineId: number;
}

export interface SettleAction {
  action: 'SETTLE';
  unitId: number;
  target: [number, number];
}

export type GameActionPayload =
  | MoveAction
  | AttackAction
  | BuildAction
  | TrainAction
  | HarvestAction
  | SettleAction;

// Unit stats
export const UNIT_STATS: Record<UnitType, { cost: number; strength: number; movement: number }> = {
  WORKER: { cost: 25, strength: 0, movement: 2 },
  SETTLER: { cost: 50, strength: 0, movement: 2 },
  WARRIOR: { cost: 30, strength: 3, movement: 2 },
  ARCHER: { cost: 40, strength: 2, movement: 2 },
  KNIGHT: { cost: 75, strength: 6, movement: 3 },
};

// Building stats
export const BUILDING_STATS: Record<BuildingType, { cost: number; hp: number }> = {
  CASTLE: { cost: 0, hp: 10 },
  BARRACKS: { cost: 100, hp: 5 },
  TOWER: { cost: 75, hp: 3 },
  WALL: { cost: 25, hp: 5 },
};

// Tribe colors for rendering
export const TRIBE_COLORS: Record<TribeColor, string> = {
  RED: '#E53935',
  BLUE: '#1E88E5',
  GREEN: '#43A047',
  YELLOW: '#FDD835',
};

// Terrain colors
export const TERRAIN_COLORS: Record<TerrainType, string> = {
  GRASS: '#A2D149',
  FOREST: '#5D8A3E',
  MOUNTAIN: '#8B7355',
  WATER: '#4DA6FF',
  GOLD_MINE: '#FFD700',
};
