'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere, Cone } from '@react-three/drei';
import * as THREE from 'three';
import type { UnitType, TribeColor } from '@/lib/types';
import { TRIBE_COLORS } from '@/lib/types';
import { hexToWorld } from '@/lib/hexUtils';

interface UnitProps {
  id: number;
  type: UnitType;
  tribe: TribeColor;
  position: [number, number]; // [q, r]
  isGhost?: boolean;
  isNew?: boolean; // For spawn animation
  isDying?: boolean; // For death animation
}

export function Unit({ type, tribe, position, isGhost = false, isNew = false, isDying = false }: UnitProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [q, r] = position;
  const targetWorld = hexToWorld({ q, r });

  // Track current animated position
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(targetWorld[0], 0.3, targetWorld[2]));
  const prevPosition = useRef<[number, number]>(position);

  // Animation states
  const [scale, setScale] = useState(isNew ? 0 : 1);
  const [isMoving, setIsMoving] = useState(false);
  const moveProgress = useRef(0);
  const startPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const endPos = useRef<THREE.Vector3>(new THREE.Vector3());

  // Detect position changes and trigger movement animation
  useEffect(() => {
    if (prevPosition.current[0] !== position[0] || prevPosition.current[1] !== position[1]) {
      const [prevQ, prevR] = prevPosition.current;
      const prevWorld = hexToWorld({ q: prevQ, r: prevR });
      const newWorld = hexToWorld({ q, r });

      startPos.current.set(prevWorld[0], 0.3, prevWorld[2]);
      endPos.current.set(newWorld[0], 0.3, newWorld[2]);
      moveProgress.current = 0;
      setIsMoving(true);
      prevPosition.current = position;
    }
  }, [position, q, r]);

  // Spawn animation
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setScale(1), 50);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Death animation
  useEffect(() => {
    if (isDying) {
      setScale(0);
    }
  }, [isDying]);

  // Animation frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth scale animation (spawn/death)
    const targetScale = isDying ? 0 : 1;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 8);
    groupRef.current.scale.setScalar(newScale);

    // Movement animation
    if (isMoving) {
      moveProgress.current += delta * 3; // Adjust speed here

      if (moveProgress.current >= 1) {
        moveProgress.current = 1;
        setIsMoving(false);
        currentPos.current.copy(endPos.current);
      } else {
        // Smooth easing function (ease out cubic)
        const t = 1 - Math.pow(1 - moveProgress.current, 3);
        currentPos.current.lerpVectors(startPos.current, endPos.current, t);

        // Add arc (jump) during movement
        const jumpHeight = 0.3 * Math.sin(moveProgress.current * Math.PI);
        currentPos.current.y = 0.3 + jumpHeight;
      }

      groupRef.current.position.copy(currentPos.current);
    } else {
      // Idle floating animation
      if (!isGhost) {
        const baseY = 0.3;
        const floatOffset = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        groupRef.current.position.y = baseY + floatOffset;
      }
    }
  });

  const color = TRIBE_COLORS[tribe];
  const opacity = isGhost ? 0.5 : 1;

  // Different shapes for different unit types
  const renderUnitModel = () => {
    switch (type) {
      case 'WORKER':
        return (
          <group>
            {/* Body */}
            <Cylinder args={[0.12, 0.15, 0.3, 8]} position={[0, 0.15, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Head */}
            <Sphere args={[0.1, 8, 8]} position={[0, 0.35, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Sphere>
            {/* Tool (pickaxe) */}
            <Cylinder args={[0.02, 0.02, 0.2, 4]} position={[0.15, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
              <meshStandardMaterial color="#4A3728" transparent opacity={opacity} flatShading />
            </Cylinder>
          </group>
        );

      case 'SETTLER':
        return (
          <group>
            {/* Body with pack */}
            <Cylinder args={[0.12, 0.18, 0.35, 8]} position={[0, 0.175, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Head */}
            <Sphere args={[0.1, 8, 8]} position={[0, 0.4, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Sphere>
            {/* Backpack */}
            <Cylinder args={[0.08, 0.08, 0.2, 6]} position={[-0.12, 0.2, 0]}>
              <meshStandardMaterial color="#8B4513" transparent opacity={opacity} flatShading />
            </Cylinder>
          </group>
        );

      case 'WARRIOR':
        return (
          <group>
            {/* Body */}
            <Cylinder args={[0.15, 0.18, 0.4, 8]} position={[0, 0.2, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Head with helmet */}
            <Sphere args={[0.12, 8, 8]} position={[0, 0.45, 0]}>
              <meshStandardMaterial color="#808080" transparent opacity={opacity} flatShading />
            </Sphere>
            {/* Shield */}
            <Cylinder args={[0.12, 0.12, 0.05, 6]} position={[-0.18, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Sword */}
            <Cylinder args={[0.02, 0.02, 0.35, 4]} position={[0.18, 0.25, 0]}>
              <meshStandardMaterial color="#C0C0C0" transparent opacity={opacity} flatShading />
            </Cylinder>
          </group>
        );

      case 'ARCHER':
        return (
          <group>
            {/* Body */}
            <Cylinder args={[0.12, 0.15, 0.35, 8]} position={[0, 0.175, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Head with hood */}
            <Cone args={[0.12, 0.2, 8]} position={[0, 0.45, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cone>
            {/* Bow */}
            <group position={[-0.15, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
              <Cylinder args={[0.01, 0.01, 0.4, 4]}>
                <meshStandardMaterial color="#8B4513" transparent opacity={opacity} flatShading />
              </Cylinder>
            </group>
            {/* Quiver */}
            <Cylinder args={[0.05, 0.05, 0.25, 6]} position={[0.1, 0.3, -0.08]} rotation={[0.2, 0, 0]}>
              <meshStandardMaterial color="#8B4513" transparent opacity={opacity} flatShading />
            </Cylinder>
          </group>
        );

      case 'KNIGHT':
        return (
          <group>
            {/* Horse body */}
            <Cylinder args={[0.15, 0.15, 0.5, 8]} position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color="#8B4513" transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Horse head */}
            <Sphere args={[0.1, 8, 8]} position={[0, 0.2, 0.3]}>
              <meshStandardMaterial color="#8B4513" transparent opacity={opacity} flatShading />
            </Sphere>
            {/* Rider body */}
            <Cylinder args={[0.1, 0.12, 0.3, 8]} position={[0, 0.4, 0]}>
              <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
            </Cylinder>
            {/* Rider head */}
            <Sphere args={[0.08, 8, 8]} position={[0, 0.6, 0]}>
              <meshStandardMaterial color="#808080" transparent opacity={opacity} flatShading />
            </Sphere>
            {/* Lance */}
            <Cylinder args={[0.02, 0.02, 0.6, 4]} position={[0.2, 0.5, 0]} rotation={[0.3, 0, 0]}>
              <meshStandardMaterial color="#C0C0C0" transparent opacity={opacity} flatShading />
            </Cylinder>
          </group>
        );

      default:
        return (
          <Sphere args={[0.2, 8, 8]}>
            <meshStandardMaterial color={color} transparent opacity={opacity} flatShading />
          </Sphere>
        );
    }
  };

  return (
    <group ref={groupRef} position={[targetWorld[0], 0.3, targetWorld[2]]} scale={scale}>
      {renderUnitModel()}
    </group>
  );
}
