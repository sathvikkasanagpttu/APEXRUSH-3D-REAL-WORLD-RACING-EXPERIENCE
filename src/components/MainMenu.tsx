import React from 'react';
import { Play, Wrench, MapPin, Trophy, Settings, HelpCircle, Flame } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface MainMenuProps {
  onStartRace: () => void;
  onOpenGarage: () => void;
  onOpenTrackSelect: () => void;
  onOpenChampionship: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartRace,
  onOpenGarage,
  onOpenTrackSelect,
  onOpenChampionship,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  const handleClick = (action: () => void) => {
    audio.init();
    audio.resume();
    audio.playGearShift();
    action();
  };

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 sm:p-12 pointer-events-none">
      {/* Title & Brand Header */}
      <div className="pointer-events-auto max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 bg-red-600 rounded-sm transform rotate-45"></span>
          <span className="text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-red-500 font-rajdhani">
            OFFICIAL MOTORSPORT SIMULATION
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter text-white font-orbitron drop-shadow-[0_4px_30px_rgba(255,255,255,0.2)]">
          APEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">RUSH</span> 3D
        </h1>

        <p className="text-sm sm:text-base font-bold text-zinc-300 tracking-[0.25em] uppercase mt-1 font-rajdhani flex items-center gap-3">
          <span>REAL-WORLD RACING EXPERIENCE</span>
          <span className="text-xs bg-red-600/30 text-red-400 px-2 py-0.5 rounded border border-red-500/40 font-bold">
            PROTOTYPE
          </span>
        </p>

        {/* Brand pillars */}
        <div className="flex items-center gap-3 mt-4 text-[11px] font-bold tracking-widest text-zinc-400 font-chakra">
          <span>SPEED</span>
          <span className="text-red-500">•</span>
          <span>PRECISION</span>
          <span className="text-red-500">•</span>
          <span>COMPETITION</span>
          <span className="text-red-500">•</span>
          <span>REALISM</span>
        </div>
      </div>

      {/* Main Menu Action Buttons */}
      <div className="pointer-events-auto flex flex-col gap-2.5 max-w-xs sm:max-w-sm">
        <button
          onClick={() => handleClick(onStartRace)}
          className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black italic text-lg sm:text-xl py-3.5 px-6 rounded-xl shadow-[0_0_30px_rgba(225,6,0,0.5)] border border-red-400/40 flex items-center justify-between transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] font-orbitron"
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 fill-white" />
            <span>START RACE</span>
          </div>
          <Flame className="w-5 h-5 text-amber-300 animate-pulse group-hover:scale-125 transition-transform" />
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <button
          onClick={() => handleClick(onOpenGarage)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-cyan-400/50 text-white font-bold text-base py-3 px-5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] font-rajdhani tracking-wider shadow-lg"
        >
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>GARAGE & TUNING</span>
        </button>

        <button
          onClick={() => handleClick(onOpenTrackSelect)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-cyan-400/50 text-white font-bold text-base py-3 px-5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] font-rajdhani tracking-wider shadow-lg"
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>TRACK SELECT</span>
        </button>

        <button
          onClick={() => handleClick(onOpenChampionship)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-amber-400/50 text-white font-bold text-base py-3 px-5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] font-rajdhani tracking-wider shadow-lg"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>CHAMPIONSHIP CAREER</span>
        </button>

        <button
          onClick={() => handleClick(onOpenSettings)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-white/30 text-white font-bold text-base py-3 px-5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] font-rajdhani tracking-wider shadow-lg"
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>SETTINGS</span>
        </button>

        <button
          onClick={() => handleClick(onOpenHowToPlay)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-white/30 text-white font-bold text-base py-3 px-5 rounded-xl flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] font-rajdhani tracking-wider shadow-lg"
        >
          <HelpCircle className="w-4 h-4 text-zinc-400" />
          <span>HOW TO PLAY</span>
        </button>
      </div>

      {/* Footer controls reminder */}
      <div className="pointer-events-auto flex items-center justify-between text-xs text-zinc-400 font-chakra">
        <div className="flex items-center gap-4">
          <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-white">W/↑</kbd> DRIVE</span>
          <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-white">SPACE</kbd> DRIFT</span>
          <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-white">SHIFT</kbd> BOOST</span>
          <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-white">C</kbd> CAMERA</span>
        </div>
        <span className="hidden sm:inline">APEXRUSH 3D ENGINE v1.0 • WEBGL 60FPS</span>
      </div>
    </div>
  );
};
