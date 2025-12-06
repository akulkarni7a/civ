'use client';

import { useRef, useMemo } from 'react';
import { Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { TerrainType, TribeColor } from '@/lib/types';
import { TERRAIN_COLORS, TRIBE_COLORS } from '@/lib/types';
import { hexToWorld, HEX_SIZE } from '@/lib/hexUtils';

interface HexTileProps {
  q: number;
  r: number;
  terrain: TerrainType;
  owner: TribeColor | null;
  isHovered?: boolean;
  onClick?: () => void;
}

// Create hex shape points for border
function createHexPoints(): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(
      new THREE.Vector3(
        HEX_SIZE * 0.95 * Math.cos(angle),
        0.01,
        HEX_SIZE * 0.95 * Math.sin(angle)
      )
    );
  }
  return points;
}

export function HexTile({ q, r, terrain, owner, isHovered, onClick }: HexTileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [x, , z] = hexToWorld({ q, r });

  const hexPoints = useMemo(() => createHexPoints(), []);

  // Get terrain color
  const terrainColor = TERRAIN_COLORS[terrain];

  // Get height based on terrain
  const height = useMemo(() => {
    switch (terrain) {
      case 'MOUNTAIN':
        return 0.6;
      case 'FOREST':
        return 0.3;
      case 'WATER':
        return 0.05;
      default:
        return 0.15;
    }
  }, [terrain]);

  // Owner border color
  const borderColor = owner ? TRIBE_COLORS[owner] : null;

  return (
    <group position={[x, 0, z]}>
      {/* Main hex tile */}
      <Cylinder
        ref={meshRef}
        args={[HEX_SIZE * 0.95, HEX_SIZE * 0.95, height, 6]}
        rotation={[0, Math.PI / 6, 0]}
        position={[0, height / 2, 0]}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={isHovered ? '#ffffff' : terrainColor}
          flatShading
        />
      </Cylinder>

      {/* Terrain decorations */}
      {terrain === 'FOREST' && (
        <group position={[0, height, 0]}>
          {/* Simple tree placeholder - cone */}
          <Cylinder
            args={[0, 0.3, 0.5, 6]}
            position={[0, 0.25, 0]}
          >
            <meshStandardMaterial color="#2D5A27" flatShading />
          </Cylinder>
          <Cylinder
            args={[0.05, 0.05, 0.2, 6]}
            position={[0, 0, 0]}
          >
            <meshStandardMaterial color="#4A3728" flatShading />
          </Cylinder>
        </group>
      )}

      {terrain === 'MOUNTAIN' && (
        <group position={[0, height, 0]}>
          {/* Mountain peak placeholder */}
          <Cylinder
            args={[0, 0.4, 0.5, 4]}
            position={[0, 0.25, 0]}
          >
            <meshStandardMaterial color="#6B5B4F" flatShading />
          </Cylinder>
        </group>
      )}

      {terrain === 'GOLD_MINE' && (
        <group position={[0, height, 0]}>
          {/* Gold mine indicator */}
          <Cylinder
            args={[0.15, 0.2, 0.15, 8]}
            position={[0, 0.075, 0]}
          >
            <meshStandardMaterial color="#FFD700" flatShading emissive="#FFD700" emissiveIntensity={0.3} />
          </Cylinder>
        </group>
      )}

      {/* Owner border */}
      {borderColor && (
        <Line
          points={hexPoints}
          color={borderColor}
          lineWidth={3}
          position={[0, height + 0.01, 0]}
        />
      )}
    </group>
  );
}
