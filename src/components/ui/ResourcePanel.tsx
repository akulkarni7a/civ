'use client';

import type { TribeColor, TribeState } from '@/lib/types';
import { TRIBE_COLORS } from '@/lib/types';

interface ResourcePanelProps {
  tribes: Record<TribeColor, TribeState> | null;
}

export function ResourcePanel({ tribes }: ResourcePanelProps) {
  if (!tribes) return null;

  const tribeOrder: TribeColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

  return (
    <div className="bg-zinc-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-zinc-700">
      <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">
        Resources
      </h3>

      <div className="space-y-2">
        {tribeOrder.map((tribe) => {
          const state = tribes[tribe];
          if (!state.alive) {
            return (
              <div key={tribe} className="flex items-center gap-2 opacity-40">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                />
                <span className="text-zinc-500 text-sm line-through">
                  {tribe}
                </span>
                <span className="text-zinc-600 text-xs">Eliminated</span>
              </div>
            );
          }

          return (
            <div key={tribe} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                />
                <span className="text-white text-sm">{tribe}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">⚜</span>
                <span className="text-white font-mono text-sm">
                  {state.gold}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
