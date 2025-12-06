'use client';

import { useGameStore } from '@/store/gameStore';
import { TRIBE_COLORS } from '@/lib/types';

export function PRSidebar() {
  const { gameState, currentPR } = useGameStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-700">
        <h2 className="text-white font-bold text-lg">Activity Feed</h2>
        <p className="text-zinc-400 text-sm">Watch the AI tribes battle</p>
      </div>

      {/* Current PR Status */}
      {currentPR && (
        <div className="p-4 border-b border-zinc-700 bg-zinc-700/50">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: TRIBE_COLORS[currentPR.tribe] }}
            />
            <span className="text-white font-semibold text-sm">
              {currentPR.tribe} Tribe
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                currentPR.state === 'open'
                  ? 'bg-green-900 text-green-300'
                  : currentPR.state === 'merged'
                  ? 'bg-purple-900 text-purple-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              {currentPR.state}
            </span>
          </div>

          <a
            href={currentPR.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm block truncate"
          >
            PR #{currentPR.number}: {currentPR.title}
          </a>

          {currentPR.buildStatus && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  currentPR.buildStatus === 'success'
                    ? 'bg-green-400'
                    : currentPR.buildStatus === 'failure'
                    ? 'bg-red-400 animate-pulse'
                    : 'bg-yellow-400 animate-pulse'
                }`}
              />
              <span className="text-zinc-400 text-xs capitalize">
                Build {currentPR.buildStatus}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Game History */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-3">
          Recent Moves
        </h3>

        {gameState?.history && gameState.history.length > 0 ? (
          <div className="space-y-3">
            {[...gameState.history].reverse().slice(0, 20).map((action, index) => (
              <div
                key={`${action.turn}-${index}`}
                className="bg-zinc-700/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: TRIBE_COLORS[action.tribe] }}
                  />
                  <span className="text-white text-sm font-medium">
                    {action.tribe}
                  </span>
                  <span className="text-zinc-500 text-xs">
                    Turn {action.turn}
                  </span>
                </div>
                <p className="text-zinc-300 text-sm">
                  {formatAction(action)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-zinc-500 text-sm text-center py-8">
            No moves yet. Waiting for the game to begin...
          </div>
        )}
      </div>

      {/* Footer with GitHub link */}
      <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">View on GitHub</span>
        </a>
      </div>
    </div>
  );
}

function formatAction(action: { action: string; details: Record<string, unknown> }): string {
  switch (action.action) {
    case 'MOVE':
      return `Moved unit to (${(action.details.target as number[])?.join(', ')})`;
    case 'ATTACK':
      return `Attacked enemy unit #${action.details.targetId}`;
    case 'BUILD':
      return `Built ${action.details.building} at (${(action.details.position as number[])?.join(', ')})`;
    case 'TRAIN':
      return `Trained ${action.details.unitType}`;
    case 'HARVEST':
      return `Started harvesting gold mine #${action.details.mineId}`;
    case 'SETTLE':
      return `Expanded territory to (${(action.details.target as number[])?.join(', ')})`;
    default:
      return action.action;
  }
}
