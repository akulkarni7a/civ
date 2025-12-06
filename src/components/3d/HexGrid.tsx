'use client';

import { useMemo, useState } from 'react';
import { HexTile } from './HexTile';
import type { Tile, TribeColor } from '@/lib/types';
import { hexKey } from '@/lib/hexUtils';

interface HexGridProps {
  tiles: Tile[];
  width: number;
  height: number;
  onTileClick?: (q: number, r: number) => void;
}

export function HexGrid({ tiles, width, height, onTileClick }: HexGridProps) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Create a map for quick tile lookup
  const tileMap = useMemo(() => {
    const map = new Map<string, Tile>();
    tiles.forEach((tile) => {
      map.set(hexKey({ q: tile.q, r: tile.r }), tile);
    });
    return map;
  }, [tiles]);

  // Generate grid if tiles not provided (for testing/empty state)
  const gridTiles = useMemo(() => {
    if (tiles.length > 0) return tiles;

    // Generate default grid
    const generated: Tile[] = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        generated.push({
          q,
          r,
          terrain: 'GRASS',
          owner: null,
        });
      }
    }
    return generated;
  }, [tiles, width, height]);

  return (
    <group>
      {gridTiles.map((tile) => {
        const key = hexKey({ q: tile.q, r: tile.r });
        return (
          <HexTile
            key={key}
            q={tile.q}
            r={tile.r}
            terrain={tile.terrain}
            owner={tile.owner}
            isHovered={hoveredTile === key}
            onClick={() => onTileClick?.(tile.q, tile.r)}
          />
        );
      })}
    </group>
  );
}
