import React from 'react';
import { CHAMPIONSHIP_RACES, ChampionshipRace } from '../data/championshipData';
import { ArrowLeft, Trophy, Lock, CheckCircle, Play, Star } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface ChampionshipProps {
  unlockedStage: number;
  totalPoints: number;
  onStartRace: (race: ChampionshipRace) => void;
  onBack: () => void;
}

export const Championship: React.FC<ChampionshipProps> = ({
  unlockedStage,
  totalPoints,
  onStartRace,
  onBack,
}) => {
  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
      {/* Header */}
      <div className="pointer-events-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 font-rajdhani"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MENU</span>
        </button>

        <div className="text-right flex items-center gap-4">
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-4 py-1.5 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300 font-orbitron">{totalPoints} PTS</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">CAREER PROGRESSION</span>
            <h2 className="text-2xl sm:text-3xl font-black italic text-white font-orbitron">WORLD CHAMPIONSHIP</h2>
          </div>
        </div>
      </div>

      {/* Career Ladder */}
      <div className="pointer-events-auto my-auto max-w-4xl w-full mx-auto flex flex-col gap-3">
        {CHAMPIONSHIP_RACES.map(race => {
          const isUnlocked = race.stage <= unlockedStage;
          const isCompleted = race.stage < unlockedStage;

          return (
            <div
              key={race.id}
              className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl flex items-center justify-between transition-all ${
                isUnlocked
                  ? 'bg-black/80 border-white/15 hover:border-red-500/50 shadow-xl'
                  : 'bg-black/40 border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black italic text-lg font-orbitron border ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                      : isUnlocked
                      ? 'bg-red-600/30 border-red-500 text-red-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : `R${race.stage}`}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black italic text-white font-orbitron">{race.name}</span>
                    <span className="text-xs text-red-500 font-bold uppercase">• {race.subtitle}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1 max-w-lg">{race.description}</div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-400">
                    <span>{race.totalLaps} LAPS</span>
                    <span>•</span>
                    <span>CONDITIONS: {race.weather} / {race.timeOfDay}</span>
                    <span>•</span>
                    <span className="text-amber-400">+{race.rewardPoints} CHAMPIONSHIP PTS</span>
                  </div>
                </div>
              </div>

              <div>
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      audio.playGearShift();
                      onStartRace(race);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-black italic px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(225,6,0,0.5)] border border-red-400/40 flex items-center gap-2 cursor-pointer font-orbitron text-xs sm:text-sm active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>RACE NOW</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold bg-zinc-900/60 px-4 py-2 rounded-xl border border-zinc-800">
                    <Lock className="w-4 h-4" />
                    <span>LOCKED</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
