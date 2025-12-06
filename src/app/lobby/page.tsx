'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { TRIBE_COLORS } from '@/lib/types';
import type { TribeColor } from '@/lib/types';

interface PromptContribution {
  id: string;
  tribe: TribeColor;
  text: string;
  timestamp: number;
}

const LOBBY_DURATION = 30 * 60; // 30 minutes in seconds

export default function LobbyPage() {
  const [selectedTribe, setSelectedTribe] = useState<TribeColor>('RED');
  const [promptText, setPromptText] = useState('');
  const [contributions, setContributions] = useState<PromptContribution[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(LOBBY_DURATION);
  const [lobbyActive, setLobbyActive] = useState(true);

  // Timer countdown
  useEffect(() => {
    if (!lobbyActive) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setLobbyActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lobbyActive]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle contribution submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || !lobbyActive) return;

    const newContribution: PromptContribution = {
      id: Math.random().toString(36).substr(2, 9),
      tribe: selectedTribe,
      text: promptText.trim(),
      timestamp: Date.now(),
    };

    setContributions((prev) => [...prev, newContribution]);
    setPromptText('');
  };

  // Get contributions for a specific tribe
  const getTribeContributions = (tribe: TribeColor) =>
    contributions.filter((c) => c.tribe === tribe);

  const tribes: TribeColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

  return (
    <div className="min-h-screen bg-zinc-900">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
            <p className="text-zinc-400 text-lg">
              Shape the AI tribes&apos; strategies before the battle begins
            </p>
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-8">
            <div
              className={`px-8 py-4 rounded-2xl ${
                lobbyActive
                  ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-700'
                  : 'bg-red-900/50 border border-red-700'
              }`}
            >
              <div className="text-center">
                <div className="text-sm text-zinc-400 uppercase tracking-wider mb-1">
                  {lobbyActive ? 'Time Remaining' : 'Lobby Closed'}
                </div>
                <div className="text-4xl font-mono font-bold text-white">
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-zinc-800/50 rounded-xl p-6 mb-8 border border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-3">How It Works</h2>
            <ol className="list-decimal list-inside text-zinc-300 space-y-2">
              <li>Select a tribe you want to influence</li>
              <li>Write strategic hints or personality traits</li>
              <li>Your contributions are visible to everyone in real-time</li>
              <li>When the timer ends, all prompts are aggregated using AI</li>
              <li>Each tribe&apos;s Jules instance receives the combined prompt</li>
            </ol>
          </div>

          {/* Prompt Input */}
          {lobbyActive && (
            <div className="bg-zinc-800/50 rounded-xl p-6 mb-8 border border-zinc-700">
              <h2 className="text-xl font-semibold text-white mb-4">Add Your Influence</h2>

              {/* Tribe Selection */}
              <div className="flex gap-3 mb-4">
                {tribes.map((tribe) => (
                  <button
                    key={tribe}
                    onClick={() => setSelectedTribe(tribe)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      selectedTribe === tribe
                        ? 'bg-zinc-600 ring-2 ring-offset-2 ring-offset-zinc-800'
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                    style={{
                      ringColor: selectedTribe === tribe ? TRIBE_COLORS[tribe] : undefined,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                    />
                    <span className="text-white font-medium">{tribe}</span>
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g., 'Be aggressive early game' or 'Speak like a pirate'"
                  className="flex-1 bg-zinc-700 text-white px-4 py-3 rounded-lg border border-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!promptText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Submit
                </button>
              </form>
              <div className="text-right text-zinc-500 text-sm mt-2">
                {promptText.length}/200 characters
              </div>
            </div>
          )}

          {/* Tribe Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tribes.map((tribe) => {
              const tribeContributions = getTribeContributions(tribe);
              return (
                <div
                  key={tribe}
                  className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                    />
                    <h3 className="text-xl font-semibold text-white">{tribe} Tribe</h3>
                    <span className="text-zinc-500 text-sm">
                      ({tribeContributions.length} contributions)
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tribeContributions.length === 0 ? (
                      <p className="text-zinc-500 italic">No contributions yet...</p>
                    ) : (
                      tribeContributions.map((contribution) => (
                        <div
                          key={contribution.id}
                          className="bg-zinc-700/50 rounded-lg px-4 py-2"
                        >
                          <p className="text-zinc-200">&quot;{contribution.text}&quot;</p>
                          <p className="text-zinc-500 text-xs mt-1">
                            {new Date(contribution.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start Game Button */}
          {!lobbyActive && (
            <div className="text-center mt-8">
              <button
                onClick={() => (window.location.href = '/')}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
              >
                Start the Battle!
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
