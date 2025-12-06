'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';
import { TRIBE_COLORS } from '@/lib/types';
import type { TribeColor } from '@/lib/types';

interface GameSummary {
  gameId: string;
  winner: TribeColor | null;
  turnCount: number;
  startedAt: string;
  endedAt: string | null;
  status: 'IN_PROGRESS' | 'FINISHED';
}

// Mock data for demonstration
const mockGames: GameSummary[] = [
  {
    gameId: 'game_001',
    winner: null,
    turnCount: 1,
    startedAt: new Date().toISOString(),
    endedAt: null,
    status: 'IN_PROGRESS',
  },
];

export default function HistoryPage() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch from /api/history
    // For now, use mock data
    setTimeout(() => {
      setGames(mockGames);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Game History</h1>
            <p className="text-zinc-400 text-lg">
              View past battles and their outcomes
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as TribeColor[]).map((tribe) => {
              const wins = games.filter((g) => g.winner === tribe).length;
              return (
                <div
                  key={tribe}
                  className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                    />
                    <span className="text-zinc-400 text-sm">{tribe}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{wins} wins</div>
                </div>
              );
            })}
          </div>

          {/* Games List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">All Games</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No games played yet. Start a new game from the lobby!
              </div>
            ) : (
              games.map((game) => (
                <Link
                  key={game.gameId}
                  href={`/history/${game.gameId}`}
                  className="block bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {game.gameId}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            game.status === 'IN_PROGRESS'
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {game.status === 'IN_PROGRESS' ? 'Live' : 'Finished'}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-sm">
                        Started: {new Date(game.startedAt).toLocaleDateString()}
                        {' - '}
                        {game.turnCount} turns
                      </div>
                    </div>

                    <div className="text-right">
                      {game.winner ? (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Winner:</span>
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: TRIBE_COLORS[game.winner] }}
                          />
                          <span className="text-white font-semibold">
                            {game.winner}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">In Progress</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
