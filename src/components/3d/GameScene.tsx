'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { HexGrid } from './HexGrid';
import { Unit } from './Unit';
import { Building } from './Building';
import { useGameStore } from '@/store/gameStore';
import { BUILDING_STATS } from '@/lib/types';

function Scene() {
  const { gameState, glitchingTribes } = useGameStore();

  if (!gameState) {
    // Render empty grid for loading state
    return (
      <>
        <HexGrid tiles={[]} width={20} height={20} />
      </>
    );
  }

  return (
    <>
      {/* Hex grid */}
      <HexGrid
        tiles={gameState.map.tiles}
        width={gameState.map.width}
        height={gameState.map.height}
      />

      {/* Buildings */}
      {gameState.buildings.map((building) => (
        <Building
          key={`building-${building.id}`}
          id={building.id}
          type={building.type}
          tribe={building.tribe}
          position={building.position}
          hp={building.hp}
          maxHp={BUILDING_STATS[building.type].hp}
          isGlitching={glitchingTribes.has(building.tribe) && building.type === 'CASTLE'}
        />
      ))}

      {/* Units */}
      {gameState.units.map((unit) => (
        <Unit
          key={`unit-${unit.id}`}
          id={unit.id}
          type={unit.type}
          tribe={unit.tribe}
          position={unit.position}
        />
      ))}
    </>
  );
}

export function GameScene() {
  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[15, 20, 25]}
          fov={50}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Environment for nice reflections */}
        <Suspense fallback={null}>
          <Environment preset="sunset" />
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.5}
          target={[10, 0, 10]}
        />

        {/* Game content */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>

        {/* Ground plane for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.1, 10]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  );
}
