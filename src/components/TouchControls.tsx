import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Flame, Disc } from 'lucide-react';
import { InputManager } from '../systems/InputManager';

interface TouchControlsProps {
  inputManager: InputManager | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ inputManager }) => {
  if (!inputManager) return null;

  return (
    <div className="absolute inset-x-0 bottom-6 pointer-events-none flex justify-between px-6 sm:px-12 z-20 select-none md:hidden">
      {/* Left side: Steering Left / Right */}
      <div className="flex gap-4 pointer-events-auto">
        <button
          onTouchStart={() => { inputManager.touchSteer = -1; }}
          onTouchEnd={() => { inputManager.touchSteer = 0; }}
          className="w-16 h-16 rounded-2xl bg-black/60 active:bg-cyan-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          onTouchStart={() => { inputManager.touchSteer = 1; }}
          onTouchEnd={() => { inputManager.touchSteer = 0; }}
          className="w-16 h-16 rounded-2xl bg-black/60 active:bg-cyan-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right side: Handbrake, Boost, Brake, Throttle */}
      <div className="flex gap-3 pointer-events-auto items-end">
        {/* Drift / Handbrake */}
        <button
          onTouchStart={() => { inputManager.touchHandbrake = true; }}
          onTouchEnd={() => { inputManager.touchHandbrake = false; }}
          className="w-14 h-14 rounded-2xl bg-black/60 active:bg-yellow-500/40 backdrop-blur-md border border-yellow-400/30 text-yellow-400 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <Flame className="w-5 h-5" />
          <span className="text-[8px] font-bold mt-0.5">DRIFT</span>
        </button>

        {/* Boost */}
        <button
          onTouchStart={() => { inputManager.touchBoost = true; }}
          onTouchEnd={() => { inputManager.touchBoost = false; }}
          className="w-14 h-14 rounded-2xl bg-cyan-600/60 active:bg-cyan-400 backdrop-blur-md border border-cyan-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <Zap className="w-5 h-5" />
          <span className="text-[8px] font-bold mt-0.5">BOOST</span>
        </button>

        {/* Brake / Reverse */}
        <button
          onTouchStart={() => { inputManager.touchBrake = 1; }}
          onTouchEnd={() => { inputManager.touchBrake = 0; }}
          className="w-16 h-16 rounded-2xl bg-black/70 active:bg-red-600 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-bold text-xs"
        >
          <Disc className="w-6 h-6 text-red-400" />
          <span className="text-[9px] mt-0.5">BRAKE</span>
        </button>

        {/* Accelerate Gas */}
        <button
          onTouchStart={() => { inputManager.touchThrottle = 1; }}
          onTouchEnd={() => { inputManager.touchThrottle = 0; }}
          className="w-18 h-20 rounded-2xl bg-gradient-to-t from-red-600 to-red-500 active:from-red-500 active:to-red-400 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(225,6,0,0.5)] border border-red-400 active:scale-95 transition-transform font-black italic text-sm font-orbitron"
        >
          <span>GAS</span>
          <span className="text-[8px] tracking-widest uppercase opacity-80">RACE</span>
        </button>
      </div>
    </div>
  );
};
