/**
 * Hexagonal grid utilities using axial coordinates (q, r)
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

export interface HexCoord {
  q: number;
  r: number;
}

export interface CubeCoord {
  x: number;
  y: number;
  z: number;
}

// Hex size (outer radius)
export const HEX_SIZE = 1;

// Spacing between hex centers
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

/**
 * Convert axial coordinates to 3D world position
 * Using pointy-top hexagons
 */
export function hexToWorld(hex: HexCoord): [number, number, number] {
  const x = HEX_SIZE * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const z = HEX_SIZE * ((3 / 2) * hex.r);
  return [x, 0, z];
}

/**
 * Convert world position to nearest hex coordinate
 */
export function worldToHex(x: number, z: number): HexCoord {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * z) / HEX_SIZE;
  const r = ((2 / 3) * z) / HEX_SIZE;
  return hexRound({ q, r });
}

/**
 * Round fractional hex coordinates to nearest hex
 */
export function hexRound(hex: HexCoord): HexCoord {
  const cube = axialToCube(hex);
  const rounded = cubeRound(cube);
  return cubeToAxial(rounded);
}

/**
 * Convert axial to cube coordinates
 */
export function axialToCube(hex: HexCoord): CubeCoord {
  return {
    x: hex.q,
    z: hex.r,
    y: -hex.q - hex.r,
  };
}

/**
 * Convert cube to axial coordinates
 */
export function cubeToAxial(cube: CubeCoord): HexCoord {
  return {
    q: cube.x,
    r: cube.z,
  };
}

/**
 * Round cube coordinates
 */
export function cubeRound(cube: CubeCoord): CubeCoord {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { x: rx, y: ry, z: rz };
}

/**
 * Get all 6 neighboring hex coordinates
 */
export function hexNeighbors(hex: HexCoord): HexCoord[] {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  return directions.map((dir) => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Calculate distance between two hexes
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = axialToCube(a);
  const bc = axialToCube(b);
  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  );
}

/**
 * Get all hexes within a certain range
 */
export function hexesInRange(center: HexCoord, range: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}

/**
 * Create a hex key for use in Maps/Sets
 */
export function hexKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

/**
 * Parse a hex key back to coordinates
 */
export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Check if hex is within map bounds
 */
export function isInBounds(hex: HexCoord, width: number, height: number): boolean {
  return hex.q >= 0 && hex.q < width && hex.r >= 0 && hex.r < height;
}
