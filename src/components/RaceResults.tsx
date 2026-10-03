import React, { useEffect } from 'react';
import { RaceResultEntry } from '../data/gameTypes';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowRight, Home, Medal } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface RaceResultsProps {
  results: RaceResultEntry[];
  playerPosition: number;
  onRestart: () => void;
  onContinue: () => void;
  onQuitToMenu: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  results,
  playerPosition,
  onRestart,
  onContinue,
  onQuitToMenu,
}) => {
  useEffect(() => {
    if (playerPosition <= 3) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [playerPosition]);

  const playerEntry = results.find(r => r.isPlayer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
      <div className="bg-zinc-950/95 border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col gap-6">
        {/* Banner */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/40 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 font-chakra">
            <Trophy className="w-3.5 h-3.5" />
            <span>OFFICIAL CLASSIFICATION</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-black italic text-white font-orbitron">
            {playerPosition === 1 ? 'RACE VICTORY!' : playerPosition <= 3 ? 'PODIUM FINISH!' : 'RACE COMPLETE'}
          </h2>

          <p className="text-sm text-zinc-400 font-bold uppercase tracking-wider mt-1">
            YOU FINISHED IN <span className="text-white font-black italic">P{playerPosition}</span>
          </p>
        </div>

        {/* Standings Table */}
        <div className="bg-zinc-900/60 rounded-2xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-900/90 text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-orbitron border-b border-white/5">
              <tr>
                <th className="py-2.5 px-4">POS</th>
                <th className="py-2.5 px-4">DRIVER</th>
                <th className="py-2.5 px-4">TOTAL TIME</th>
                <th className="py-2.5 px-4 text-right">POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-chakra font-medium">
              {results.map(r => (
                <tr
                  key={r.name}
                  className={r.isPlayer ? 'bg-red-600/20 font-bold text-white' : 'text-zinc-300 hover:bg-white/5'}
                >
                  <td className="py-2 px-4 flex items-center gap-1.5 font-orbitron font-bold">
                    {r.position <= 3 ? (
                      <Medal
                        className={`w-4 h-4 ${
                          r.position === 1 ? 'text-amber-400' : r.position === 2 ? 'text-slate-300' : 'text-amber-700'
                        }`}
                      />
                    ) : null}
                    <span>{r.position}</span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={r.isPlayer ? 'text-cyan-400' : ''}>{r.name}</span>
                  </td>
                  <td className="py-2 px-4 font-mono text-xs">{r.time.toFixed(3)}s</td>
                  <td className="py-2 px-4 text-right text-amber-400 font-bold">+{r.pointsAwarded} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              audio.playGearShift();
              onQuitToMenu();
            }}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-xs sm:text-sm active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>

          <button
            onClick={() => {
              audio.playGearShift();
              onRestart();
            }}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-xs sm:text-sm active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART</span>
          </button>

          <button
            onClick={() => {
              audio.playGearShift();
              onContinue();
            }}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black italic py-3.5 rounded-xl shadow-[0_0_20px_rgba(225,6,0,0.5)] border border-red-400/40 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-xs sm:text-sm active:scale-95 transition-all"
          >
            <span>NEXT EVENT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
