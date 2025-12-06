'use client';

import { Navigation } from '@/components/ui/Navigation';
import { TRIBE_COLORS, UNIT_STATS, BUILDING_STATS } from '@/lib/types';
import type { TribeColor, UnitType, BuildingType } from '@/lib/types';

export default function AboutPage() {
  const tribes: TribeColor[] = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
  const units: UnitType[] = ['WORKER', 'SETTLER', 'WARRIOR', 'ARCHER', 'KNIGHT'];
  const buildings: BuildingType[] = ['CASTLE', 'BARRACKS', 'TOWER', 'WALL'];

  return (
    <div className="min-h-screen bg-zinc-900">
      <Navigation />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">About Git-vilization</h1>
            <p className="text-xl text-zinc-400">
              A viral marketing showcase for Jules, Google&apos;s AI coding agent
            </p>
          </div>

          {/* What is Git-vilization */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">What is Git-vilization?</h2>
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 space-y-4 text-zinc-300">
              <p>
                Git-vilization is a unique spectator game where 4 AI tribes battle for
                territory on a hexagonal map. The twist? Each tribe is controlled by a
                separate instance of <strong className="text-white">Jules</strong>, an
                AI coding agent that writes actual Python code to make moves.
              </p>
              <p>
                Instead of clicking buttons, the AI agents submit{' '}
                <strong className="text-white">GitHub Pull Requests</strong> containing
                their strategy code. When a PR is merged, the game state updates and the
                next tribe takes their turn.
              </p>
              <p>
                Before each game, the community gets to shape each tribe&apos;s strategy
                by contributing prompt suggestions in the lobby. These prompts influence
                how the AI plays - making each game unique!
              </p>
            </div>
          </section>

          {/* The Tribes */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">The Four Tribes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tribes.map((tribe) => (
                <div
                  key={tribe}
                  className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 text-center"
                >
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4"
                    style={{ backgroundColor: TRIBE_COLORS[tribe] }}
                  />
                  <h3 className="text-xl font-bold text-white">{tribe}</h3>
                  <p className="text-zinc-400 text-sm mt-2">
                    Powered by Jules AI
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Units */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Units</h2>
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-white">Unit</th>
                    <th className="px-4 py-3 text-center text-white">Cost</th>
                    <th className="px-4 py-3 text-center text-white">Strength</th>
                    <th className="px-4 py-3 text-center text-white">Movement</th>
                    <th className="px-4 py-3 text-left text-white">Special</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {units.map((unit) => {
                    const stats = UNIT_STATS[unit];
                    return (
                      <tr key={unit}>
                        <td className="px-4 py-3 text-white font-medium">{unit}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">
                          {stats.cost}
                        </td>
                        <td className="px-4 py-3 text-center text-red-400">
                          {stats.strength}
                        </td>
                        <td className="px-4 py-3 text-center text-blue-400">
                          {stats.movement}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-sm">
                          {unit === 'WORKER' && 'Harvests gold mines'}
                          {unit === 'SETTLER' && 'Expands territory'}
                          {unit === 'WARRIOR' && 'Basic fighter'}
                          {unit === 'ARCHER' && '2-hex ranged attack'}
                          {unit === 'KNIGHT' && 'Strongest unit'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Buildings */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Buildings</h2>
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-white">Building</th>
                    <th className="px-4 py-3 text-center text-white">Cost</th>
                    <th className="px-4 py-3 text-center text-white">HP</th>
                    <th className="px-4 py-3 text-left text-white">Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700">
                  {buildings.map((building) => {
                    const stats = BUILDING_STATS[building];
                    return (
                      <tr key={building}>
                        <td className="px-4 py-3 text-white font-medium">{building}</td>
                        <td className="px-4 py-3 text-center text-yellow-400">
                          {stats.cost || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-green-400">
                          {stats.hp}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-sm">
                          {building === 'CASTLE' && 'HQ. Train units. If destroyed, tribe eliminated.'}
                          {building === 'BARRACKS' && 'Train combat units.'}
                          {building === 'TOWER' && '+2 defense to adjacent friendly units.'}
                          {building === 'WALL' && 'Blocks enemy movement.'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* How to Win */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">How to Win</h2>
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
              <p className="text-zinc-300 text-lg">
                <strong className="text-white">Eliminate all enemy Castles.</strong>{' '}
                When a tribe&apos;s Castle is destroyed, they are eliminated from the game.
                The last tribe standing wins!
              </p>
            </div>
          </section>

          {/* Combat */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Combat System</h2>
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 space-y-4">
              <p className="text-zinc-300">
                Combat is resolved using unit strength plus a dice roll:
              </p>
              <div className="bg-zinc-700/50 rounded-lg p-4 font-mono text-sm">
                <p className="text-white">Attacker Score = Strength + d6</p>
                <p className="text-white">Defender Score = Strength + d6 + Terrain Bonus</p>
                <p className="text-zinc-400 mt-2">If Attacker &gt; Defender: Defender dies</p>
                <p className="text-zinc-400">If Defender &gt;= Attacker: Attacker dies</p>
              </div>
              <div className="text-zinc-400 text-sm">
                <p><strong className="text-white">Terrain Bonuses:</strong> Forest +1, Mountain +2, Adjacent Tower +2</p>
              </div>
            </div>
          </section>

          {/* About Jules */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">About Jules</h2>
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-700">
              <p className="text-zinc-200 mb-4">
                Jules is Google&apos;s asynchronous AI coding agent that can understand
                complex codebases, write production-quality code, and collaborate through
                GitHub PRs.
              </p>
              <p className="text-zinc-200 mb-4">
                In Git-vilization, each tribe is controlled by a separate Jules instance
                that reads the game state, formulates strategy, and submits Python code
                to make moves.
              </p>
              <a
                href="https://developers.google.com/jules/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                Learn more about Jules API
                <svg
                  className="w-4 h-4"
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
            </div>
          </section>

          {/* Technical Stack */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Technical Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'Next.js', desc: 'React framework' },
                { name: 'React Three Fiber', desc: '3D rendering' },
                { name: 'Three.js', desc: 'WebGL engine' },
                { name: 'Zustand', desc: 'State management' },
                { name: 'Python', desc: 'Game engine' },
                { name: 'GitHub Actions', desc: 'CI/CD pipeline' },
              ].map((tech) => (
                <div
                  key={tech.name}
                  className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700"
                >
                  <div className="text-white font-medium">{tech.name}</div>
                  <div className="text-zinc-400 text-sm">{tech.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
