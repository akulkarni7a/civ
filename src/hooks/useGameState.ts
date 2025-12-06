'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

const POLL_INTERVAL = 5000; // 5 seconds

export function useGameState() {
  const { gameState, isLoading, error, fetchGameState } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchGameState();

    // Set up polling
    intervalRef.current = setInterval(() => {
      fetchGameState();
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchGameState]);

  return { gameState, isLoading, error };
}
