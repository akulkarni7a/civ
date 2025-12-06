'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { BuildingType, TribeColor } from '@/lib/types';
import { TRIBE_COLORS } from '@/lib/types';
import { hexToWorld } from '@/lib/hexUtils';

interface BuildingProps {
  id: number;
  type: BuildingType;
  tribe: TribeColor;
  position: [number, number]; // [q, r]
  hp: number;
  maxHp: number;
  isGlitching?: boolean;
  isNew?: boolean; // For construction animation
}

export function Building({ type, tribe, position, hp, maxHp, isGlitching = false, isNew = false }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [q, r] = position;
  const [x, , z] = hexToWorld({ q, r });

  // Construction animation state
  const [constructionProgress, setConstructionProgress] = useState(isNew ? 0 : 1);
  const glitchTime = useRef(0);

  // HP-based damage state
  const hpPercent = hp / maxHp;
  const isDamaged = hpPercent < 0.5;
  const isCritical = hpPercent < 0.25;

  // Construction animation
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setConstructionProgress(1), 50);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Animation frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth construction animation
    const targetProgress = 1;
    const currentProgress = groupRef.current.scale.y;
    if (currentProgress < targetProgress) {
      const newProgress = THREE.MathUtils.lerp(currentProgress, targetProgress, delta * 4);
      groupRef.current.scale.y = newProgress;
      groupRef.current.position.y = 0.15 * newProgress;
    }

    // Glitch animation
    if (isGlitching) {
      glitchTime.current += delta;

      // Random jitter
      const jitterX = (Math.random() - 0.5) * 0.08;
      const jitterZ = (Math.random() - 0.5) * 0.08;
      groupRef.current.position.x = x + jitterX;
      groupRef.current.position.z = z + jitterZ;

      // Rotation shake
      groupRef.current.rotation.y = (Math.random() - 0.5) * 0.15;
      groupRef.current.rotation.z = (Math.random() - 0.5) * 0.05;

      // Scale pulse
      const pulse = 1 + Math.sin(glitchTime.current * 20) * 0.03;
      groupRef.current.scale.x = pulse;
      groupRef.current.scale.z = pulse;
    } else {
      // Reset position when not glitching
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, x, delta * 10);
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, z, delta * 10);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, delta * 10);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 10);
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, delta * 10);
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, delta * 10);
    }

    // Damage shake for critical buildings
    if (isCritical && !isGlitching) {
      const shake = Math.sin(state.clock.elapsedTime * 15) * 0.01;
      groupRef.current.position.x = x + shake;
    }
  });

  const color = TRIBE_COLORS[tribe];

  // Dynamic color based on state
  const getColor = () => {
    if (isGlitching) {
      // Flickering between magenta and cyan for glitch
      return Math.random() > 0.5 ? '#FF00FF' : '#00FFFF';
    }
    if (isCritical) {
      return '#FF4444'; // Red for critical
    }
    if (isDamaged) {
      // Darken color when damaged
      return new THREE.Color(color).multiplyScalar(0.7).getStyle();
    }
    return color;
  };

  const renderBuildingModel = () => {
    const buildingColor = getColor();

    switch (type) {
      case 'CASTLE':
        return (
          <group>
            {/* Main tower */}
            <Cylinder args={[0.35, 0.4, 0.8, 8]} position={[0, 0.4, 0]}>
              <meshStandardMaterial color={buildingColor} flatShading />
            </Cylinder>
            {/* Battlements */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (Math.PI / 4) * i;
              const bx = Math.cos(angle) * 0.3;
              const bz = Math.sin(angle) * 0.3;
              // Skip some battlements if damaged
              if (isDamaged && i % 2 === 0) return null;
              return (
                <Box key={i} args={[0.1, 0.15, 0.1]} position={[bx, 0.85, bz]}>
                  <meshStandardMaterial color={buildingColor} flatShading />
                </Box>
              );
            })}
            {/* Roof/spire */}
            <Cylinder args={[0, 0.25, 0.4, 8]} position={[0, 1, 0]}>
              <meshStandardMaterial color="#4A3728" flatShading />
            </Cylinder>
            {/* Flag */}
            <Cylinder args={[0.02, 0.02, 0.3, 4]} position={[0, 1.35, 0]}>
              <meshStandardMaterial color="#4A3728" flatShading />
            </Cylinder>
            <Box args={[0.15, 0.1, 0.02]} position={[0.08, 1.4, 0]}>
              <meshStandardMaterial color={color} flatShading />
            </Box>
            {/* HP Bar background */}
            <Box args={[0.6, 0.05, 0.05]} position={[0, 1.6, 0]}>
              <meshStandardMaterial color="#333333" flatShading />
            </Box>
            {/* HP Bar fill */}
            <Box args={[0.6 * hpPercent, 0.05, 0.06]} position={[(0.6 * hpPercent - 0.6) / 2, 1.6, 0]}>
              <meshStandardMaterial color={hpPercent > 0.5 ? '#44FF44' : hpPercent > 0.25 ? '#FFFF44' : '#FF4444'} flatShading />
            </Box>
          </group>
        );

      case 'BARRACKS':
        return (
          <group>
            {/* Main building */}
            <Box args={[0.6, 0.4, 0.5]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color={buildingColor} flatShading />
            </Box>
            {/* Roof */}
            <Box args={[0.7, 0.1, 0.6]} position={[0, 0.45, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color="#4A3728" flatShading />
            </Box>
            {/* Door */}
            <Box args={[0.15, 0.25, 0.05]} position={[0, 0.125, 0.26]}>
              <meshStandardMaterial color="#2D1810" flatShading />
            </Box>
            {/* Weapon rack decoration */}
            <Cylinder args={[0.02, 0.02, 0.3, 4]} position={[0.25, 0.15, 0.26]}>
              <meshStandardMaterial color="#C0C0C0" flatShading />
            </Cylinder>
            {/* HP indicator */}
            <Box args={[0.4, 0.03, 0.03]} position={[0, 0.55, 0]}>
              <meshStandardMaterial color="#333333" flatShading />
            </Box>
            <Box args={[0.4 * hpPercent, 0.03, 0.04]} position={[(0.4 * hpPercent - 0.4) / 2, 0.55, 0]}>
              <meshStandardMaterial color={hpPercent > 0.5 ? '#44FF44' : '#FF4444'} flatShading />
            </Box>
          </group>
        );

      case 'TOWER':
        return (
          <group>
            {/* Tower base */}
            <Cylinder args={[0.25, 0.3, 0.6, 6]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color={buildingColor} flatShading />
            </Cylinder>
            {/* Tower top platform */}
            <Cylinder args={[0.3, 0.25, 0.15, 6]} position={[0, 0.65, 0]}>
              <meshStandardMaterial color={buildingColor} flatShading />
            </Cylinder>
            {/* Battlements */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (Math.PI / 3) * i;
              const bx = Math.cos(angle) * 0.25;
              const bz = Math.sin(angle) * 0.25;
              if (isDamaged && i % 2 === 0) return null;
              return (
                <Box key={i} args={[0.08, 0.12, 0.08]} position={[bx, 0.78, bz]}>
                  <meshStandardMaterial color={buildingColor} flatShading />
                </Box>
              );
            })}
            {/* Pointed roof */}
            <Cylinder args={[0, 0.2, 0.25, 6]} position={[0, 0.95, 0]}>
              <meshStandardMaterial color="#4A3728" flatShading />
            </Cylinder>
            {/* Defense aura ring */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 0.85, 32]} />
              <meshStandardMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );

      case 'WALL':
        return (
          <group>
            {/* Wall segment */}
            <Box args={[0.8, 0.4, 0.15]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color="#808080" flatShading />
            </Box>
            {/* Battlements - show damage */}
            {!isCritical && (
              <Box args={[0.15, 0.15, 0.15]} position={[-0.3, 0.45, 0]}>
                <meshStandardMaterial color="#808080" flatShading />
              </Box>
            )}
            <Box args={[0.15, 0.15, 0.15]} position={[0, 0.45, 0]}>
              <meshStandardMaterial color="#808080" flatShading />
            </Box>
            {!isDamaged && (
              <Box args={[0.15, 0.15, 0.15]} position={[0.3, 0.45, 0]}>
                <meshStandardMaterial color="#808080" flatShading />
              </Box>
            )}
            {/* Cracks when damaged */}
            {isDamaged && (
              <Box args={[0.02, 0.3, 0.16]} position={[0.1, 0.2, 0]} rotation={[0, 0, 0.3]}>
                <meshStandardMaterial color="#333333" flatShading />
              </Box>
            )}
          </group>
        );

      default:
        return (
          <Box args={[0.4, 0.4, 0.4]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color={buildingColor} flatShading />
          </Box>
        );
    }
  };

  return (
    <group ref={groupRef} position={[x, 0.15, z]} scale-y={constructionProgress}>
      {renderBuildingModel()}
    </group>
  );
}
