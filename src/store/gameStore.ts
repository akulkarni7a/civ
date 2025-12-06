import { create } from 'zustand';
import type { GameState, TribeColor } from '@/lib/types';

interface PRStatus {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  tribe: TribeColor;
  url: string;
  buildStatus: 'pending' | 'success' | 'failure' | null;
}

interface GhostPreview {
  unitId?: number;
  fromPosition?: [number, number];
  toPosition?: [number, number];
  action: string;
  details: Record<string, unknown>;
}

interface GameStore {
  // Current game state
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;

  // Ghost preview for pending PR
  ghostPreview: GhostPreview | null;

  // Current PR status
  currentPR: PRStatus | null;

  // Tribes with glitch state (failed PRs)
  glitchingTribes: Set<TribeColor>;

  // Actions
  setGameState: (state: GameState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGhostPreview: (preview: GhostPreview | null) => void;
  setCurrentPR: (pr: PRStatus | null) => void;
  addGlitchingTribe: (tribe: TribeColor) => void;
  removeGlitchingTribe: (tribe: TribeColor) => void;
  fetchGameState: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isLoading: false,
  error: null,
  ghostPreview: null,
  currentPR: null,
  glitchingTribes: new Set(),

  setGameState: (state) => set({ gameState: state, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setGhostPreview: (preview) => set({ ghostPreview: preview }),
  setCurrentPR: (pr) => set({ currentPR: pr }),

  addGlitchingTribe: (tribe) =>
    set((state) => ({
      glitchingTribes: new Set([...state.glitchingTribes, tribe]),
    })),

  removeGlitchingTribe: (tribe) =>
    set((state) => {
      const newSet = new Set(state.glitchingTribes);
      newSet.delete(tribe);
      return { glitchingTribes: newSet };
    }),

  fetchGameState: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true });

    try {
      // In production, this would fetch from GitHub raw URL
      // For now, fetch from local API or static file
      const response = await fetch('/api/gamestate');

      if (!response.ok) {
        throw new Error(`Failed to fetch game state: ${response.statusText}`);
      }

      const data = await response.json();
      set({ gameState: data, isLoading: false, error: null });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch game state',
      });
    }
  },
}));
