'use client';

import type { TribeColor, GameStatus } from '@/lib/types';
import { TRIBE_COLORS } from '@/lib/types';

interface TurnIndicatorProps {
  currentTribe: TribeColor;
  turn: number;
  status: GameStatus;
}

export function TurnIndicator({ currentTribe, turn, status }: TurnIndicatorProps) {
  const tribeColor = TRIBE_COLORS[currentTribe];

  const statusText = {
    LOBBY: 'Waiting for game to start...',
    IN_PROGRESS: `${currentTribe} Tribe is thinking...`,
    FINISHED: 'Game Over',
  };

  return (
    <div className="bg-zinc-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-zinc-700">
      <div className="flex items-center gap-3">
        {/* Tribe color indicator */}
        <div
          className="w-4 h-4 rounded-full animate-pulse"
          style={{ backgroundColor: tribeColor }}
        />

        <div>
          <div className="text-white font-semibold">Turn {turn}</div>
          <div className="text-zinc-400 text-sm">{statusText[status]}</div>
        </div>
      </div>

      {/* Turn order indicator */}
      <div className="flex gap-2 mt-3">
        {(['RED', 'BLUE', 'GREEN', 'YELLOW'] as TribeColor[]).map((tribe) => (
          <div
            key={tribe}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              tribe === currentTribe ? 'scale-110 border-white' : 'border-transparent opacity-50'
            }`}
            style={{ backgroundColor: TRIBE_COLORS[tribe] }}
            title={`${tribe} Tribe`}
          />
        ))}
      </div>
    </div>
  );
}
