import React from 'react';
import { Play, RotateCcw, Settings, LogOut } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToMenu,
}) => {
  const handleClick = (action: () => void) => {
    audio.playGearShift();
    action();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl select-none">
      <div className="bg-zinc-950/90 border border-white/15 rounded-2xl max-w-sm w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-4 text-center">
        <div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">SESSION SUSPENDED</span>
          <h2 className="text-3xl font-black italic text-white font-orbitron">RACE PAUSED</h2>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={() => handleClick(onResume)}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic py-3 rounded-xl shadow-lg border border-red-400/40 flex items-center justify-center gap-2 cursor-pointer font-orbitron transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={() => handleClick(onRestart)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART RACE</span>
          </button>

          <button
            onClick={() => handleClick(onOpenSettings)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-sm transition-all active:scale-95"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={() => handleClick(onQuitToMenu)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 font-bold py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer font-orbitron text-sm transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
