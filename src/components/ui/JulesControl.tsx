'use client';

import { useState, useEffect, useCallback } from 'react';
import { TRIBE_COLORS } from '@/lib/types';
import type { TribeColor } from '@/lib/types';

interface OrchestratorStatus {
  game_id: string;
  turn: number;
  current_tribe: TribeColor;
  game_status: string;
  orchestrator: {
    current_turn: {
      tribe: TribeColor;
      session_id: string;
      status: string;
      pr_url: string | null;
    } | null;
    is_running: boolean;
  };
}

interface JulesControlProps {
  onTurnComplete?: () => void;
}

export function JulesControl({ onTurnComplete }: JulesControlProps) {
  const [status, setStatus] = useState<OrchestratorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/jules');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Failed to connect to Jules API');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleAction = async (action: 'start' | 'check' | 'complete') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Action failed');
      } else {
        if (action === 'complete' && onTurnComplete) {
          onTurnComplete();
        }
        // Refresh status
        await fetchStatus();
      }
    } catch (err) {
      setError('Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const currentTurn = status?.orchestrator?.current_turn;
  const isRunning = status?.orchestrator?.is_running;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed state - just a button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Jules Control
          {isRunning && (
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="w-80 bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-700/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold text-white">Jules AI Control</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Status */}
            {status && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Game Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    status.game_status === 'IN_PROGRESS'
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {status.game_status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Turn</span>
                  <span className="text-white">{status.turn}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Current Tribe</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[status.current_tribe] }}
                    />
                    <span className="text-white">{status.current_tribe}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Turn Status */}
            {currentTurn && (
              <div className="bg-zinc-700/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">Active Session</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    currentTurn.status === 'completed'
                      ? 'bg-green-900/50 text-green-300'
                      : currentTurn.status === 'failed'
                      ? 'bg-red-900/50 text-red-300'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {currentTurn.status}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 font-mono truncate">
                  {currentTurn.session_id}
                </div>

                {currentTurn.pr_url && (
                  <a
                    href={currentTurn.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    View PR
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAction('start')}
                disabled={loading || isRunning}
                className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Working...' : 'Start Turn'}
              </button>

              <button
                onClick={() => handleAction('check')}
                disabled={loading || !isRunning}
                className="px-3 py-2 bg-zinc-600 hover:bg-zinc-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Check
              </button>

              <button
                onClick={() => handleAction('complete')}
                disabled={loading || currentTurn?.status !== 'completed'}
                className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Complete
              </button>
            </div>

            <button
              onClick={fetchStatus}
              className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
