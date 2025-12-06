'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';
import { TurnIndicator } from '@/components/ui/TurnIndicator';
import { ResourcePanel } from '@/components/ui/ResourcePanel';
import { PRSidebar } from '@/components/ui/PRSidebar';
import { JulesControl } from '@/components/ui/JulesControl';

// Dynamic import for Three.js components (SSR disabled)
const GameScene = dynamic(
  () => import('@/components/3d/GameScene').then((mod) => mod.GameScene),
  { ssr: false }
);

export default function Home() {
  const { fetchGameState, gameState, isLoading, error } = useGameStore();

  useEffect(() => {
    fetchGameState();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchGameState, 5000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  return (
    <div className="flex h-screen w-screen bg-zinc-900 overflow-hidden">
      {/* Main game view */}
      <div className="flex-1 relative">
        {/* 3D Canvas */}
        <GameScene />

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
          <div className="flex justify-between items-start">
            {/* Left side: Logo + Nav */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <Link href="/" className="text-xl font-bold text-white">
                Git-vilization
              </Link>
              <nav className="flex gap-2">
                <Link
                  href="/lobby"
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Lobby
                </Link>
                <Link
                  href="/history"
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  History
                </Link>
                <Link
                  href="/about"
                  className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  About
                </Link>
              </nav>
            </div>

            {/* Center: Turn Indicator */}
            <div className="pointer-events-auto">
              <TurnIndicator
                currentTribe={gameState?.currentTribe ?? 'RED'}
                turn={gameState?.turn ?? 0}
                status={gameState?.status ?? 'LOBBY'}
              />
            </div>

            {/* Right: Resource panel */}
            <div className="pointer-events-auto">
              <ResourcePanel tribes={gameState?.tribes ?? null} />
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && !gameState && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-xl">Loading game state...</div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute bottom-4 left-4 bg-red-900/80 text-white px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl font-bold text-white/80 tracking-wider">
            GIT-VILIZATION
          </h1>
          <p className="text-center text-white/50 text-sm">
            AI Tribes Battle Through Code
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-zinc-800 border-l border-zinc-700 overflow-y-auto">
        <PRSidebar />
      </div>

      {/* Jules AI Control Panel */}
      <JulesControl onTurnComplete={fetchGameState} />
    </div>
  );
}
