'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';
import { TRIBE_COLORS } from '@/lib/types';
import type { TribeColor, GameState } from '@/lib/types';

interface PRRecord {
  number: number;
  title: string;
  tribe: TribeColor;
  url: string;
  mergedAt: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [prRecords, setPrRecords] = useState<PRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch game state
    fetch('/api/gamestate')
      .then((res) => res.json())
      .then((data) => {
        setGameState(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Mock PR records for demonstration
    setPrRecords([
      {
        number: 1,
        title: 'RED: Move knight toward center',
        tribe: 'RED',
        url: 'https://github.com/example/gitvilization/pull/1',
        mergedAt: new Date().toISOString(),
      },
    ]);
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navigation />
        <main className="pt-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navigation />
        <main className="pt-20 px-4">
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-white mb-4">Game Not Found</h1>
            <Link href="/history" className="text-blue-400 hover:text-blue-300">
              Back to History
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Determine winner
  const aliveTribes = Object.entries(gameState.tribes)
    .filter(([, state]) => state.alive)
    .map(([tribe]) => tribe as TribeColor);

  const winner = aliveTribes.length === 1 ? aliveTribes[0] : null;

  return (
    <div className="min-h-screen bg-zinc-900">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/history"
              className="text-zinc-400 hover:text-white text-sm mb-2 inline-block"
            >
              ← Back to History
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">{gameId}</h1>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  gameState.status === 'IN_PROGRESS'
                    ? 'bg-green-900/50 text-green-300 border border-green-700'
                    : 'bg-zinc-700 text-zinc-300'
                }`}
              >
                {gameState.status === 'IN_PROGRESS' ? 'In Progress' : 'Finished'}
              </span>
              <span className="text-zinc-400">Turn {gameState.turn}</span>
            </div>
          </div>

          {/* Winner Banner */}
          {winner && (
            <div
              className="rounded-xl p-6 mb-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${TRIBE_COLORS[winner]}33, transparent)`,
                borderColor: TRIBE_COLORS[winner],
                borderWidth: '2px',
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-2">Victory!</h2>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: TRIBE_COLORS[winner] }}
                />
                <span className="text-xl text-white">{winner} Tribe Wins!</span>
              </div>
            </div>
          )}

          {/* Tribe Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as TribeColor[]).map((tribe) => {
              const state = gameState.tribes[tribe];
              const unitCount = gameState.units.filter((u) => u.tribe === tribe).length;
              const buildingCount = gameState.buildings.filter((b) => b.tribe === tribe).length;

              return (
                <div
                  key={tribe}
                  className={`rounded-xl p-4 border ${
                    state.alive
                      ? 'bg-zinc-800/50 border-zinc-700'
                      : 'bg-zinc-900/50 border-zinc-800 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                    />
                    <span className="text-white font-semibold">{tribe}</span>
                    {!state.alive && (
                      <span className="text-red-400 text-xs">Eliminated</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Gold</span>
                      <span className="text-yellow-400">{state.gold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Units</span>
                      <span className="text-white">{unitCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Buildings</span>
                      <span className="text-white">{buildingCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PR History */}
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Pull Request History</h2>

            {prRecords.length === 0 ? (
              <p className="text-zinc-500">No PRs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {prRecords.map((pr) => (
                  <a
                    key={pr.number}
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-zinc-700/50 rounded-lg p-4 hover:bg-zinc-700 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[pr.tribe] }}
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        PR #{pr.number}: {pr.title}
                      </div>
                      <div className="text-zinc-400 text-sm">
                        Merged {new Date(pr.mergedAt).toLocaleString()}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Action History */}
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-4">Move History</h2>

            {gameState.history.length === 0 ? (
              <p className="text-zinc-500">No moves yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...gameState.history].reverse().map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-zinc-700/30 rounded-lg px-4 py-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[action.tribe] }}
                    />
                    <span className="text-zinc-400 text-sm">Turn {action.turn}</span>
                    <span className="text-white">{action.tribe}</span>
                    <span className="text-zinc-400">-</span>
                    <span className="text-zinc-300">{action.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watch Live Button */}
          {gameState.status === 'IN_PROGRESS' && (
            <div className="text-center mt-8">
              <Link
                href="/"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all"
              >
                Watch Live
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
