import React from 'react';
import { X, Gamepad, Zap, Flame, ShieldAlert, Camera } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="bg-zinc-950/90 border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span>
            <h3 className="text-xl font-black italic text-white font-orbitron">HOW TO PLAY</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 text-xs sm:text-sm text-zinc-300 overflow-y-auto max-h-[65vh] pr-1">
          {/* Key Controls Grid */}
          <div className="bg-zinc-900/70 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
            <span className="font-bold text-white uppercase font-orbitron flex items-center gap-2">
              <Gamepad className="w-4 h-4 text-cyan-400" /> DRIVER CONTROLS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Accelerate / Throttle</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">W / ↑</kbd>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Brake / Reverse</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">S / ↓</kbd>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Steer Left / Right</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">A / D or ← / →</kbd>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Handbrake / Drift</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">SPACE</kbd>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Nitro Boost</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">SHIFT</kbd>
              </div>
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg border border-white/5">
                <span>Switch Camera</span>
                <kbd className="bg-zinc-800 text-white px-2 py-0.5 rounded font-bold">C</kbd>
              </div>
            </div>
          </div>

          {/* Drifting Guide */}
          <div className="bg-zinc-900/70 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="font-bold text-white uppercase font-orbitron flex items-center gap-2 text-yellow-400">
              <Flame className="w-4 h-4" /> MASTER THE DRIFT
            </span>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Approach a corner at high speed, tap <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white">SPACE</kbd> while turning sharply to initiate a powerslide. Counter-steer into the slide to sustain the drift, generate tire smoke, and rack up combo multiplier points!
            </p>
          </div>

          {/* Nitro & Pit Stops */}
          <div className="bg-zinc-900/70 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <span className="font-bold text-white uppercase font-orbitron flex items-center gap-2 text-cyan-400">
              <Zap className="w-4 h-4" /> NITRO & PIT REPAIRS
            </span>
            <p className="text-zinc-300 leading-relaxed text-xs">
              Hold <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-white">SHIFT</kbd> for turbo thrust with exhaust fire. Boost recharges automatically. If you take damage or run low on fuel, slow down through the Pit Lane parallel to the main straight for instant repairs!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic py-3 rounded-xl font-orbitron cursor-pointer shadow-lg active:scale-98 transition-all"
        >
          READY TO RACE
        </button>
      </div>
    </div>
  );
};
