import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Flame, Disc, Camera, Pause } from 'lucide-react';
import { InputManager } from '../systems/InputManager';

interface TouchControlsProps {
  inputManager: InputManager | null;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ inputManager }) => {
  if (!inputManager) return null;

  const handleTouch = (
    e: React.TouchEvent,
    action: () => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div className="absolute inset-x-0 bottom-4 pointer-events-none flex flex-col justify-between px-3 sm:px-8 z-30 select-none md:hidden gap-3">
      {/* Top Mobile Quick Controls: CAMERA & PAUSE (Req 23) */}
      <div className="flex justify-between items-center w-full pointer-events-auto">
        <button
          onTouchStart={(e) => handleTouch(e, () => inputManager.onCameraToggle?.())}
          onClick={(e) => { e.preventDefault(); inputManager.onCameraToggle?.(); }}
          className="w-11 h-11 rounded-xl bg-black/75 active:bg-cyan-500/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform touch-none"
          aria-label="CAMERA"
        >
          <Camera className="w-5 h-5 text-cyan-400" />
        </button>

        <button
          onTouchStart={(e) => handleTouch(e, () => inputManager.onPause?.())}
          onClick={(e) => { e.preventDefault(); inputManager.onPause?.(); }}
          className="w-11 h-11 rounded-xl bg-black/75 active:bg-red-500/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform touch-none"
          aria-label="PAUSE"
        >
          <Pause className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Driving Controls: Left/Right + Drift/Boost/Brake/Gas */}
      <div className="flex justify-between items-end w-full">
        {/* Left side: Steering Left / Right */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchSteer = -1; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchSteer = 0; })}
            onTouchCancel={() => { inputManager.touchSteer = 0; }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/75 active:bg-cyan-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform touch-none"
            aria-label="LEFT"
          >
            <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchSteer = 1; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchSteer = 0; })}
            onTouchCancel={() => { inputManager.touchSteer = 0; }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/75 active:bg-cyan-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform touch-none"
            aria-label="RIGHT"
          >
            <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>

        {/* Right side: DRIFT, BOOST, BRAKE, GAS */}
        <div className="flex gap-2 sm:gap-3 pointer-events-auto items-end">
          {/* Drift / Handbrake */}
          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchHandbrake = true; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchHandbrake = false; })}
            onTouchCancel={() => { inputManager.touchHandbrake = false; }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/70 active:bg-yellow-500/40 backdrop-blur-md border border-yellow-400/30 text-yellow-400 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform touch-none"
            aria-label="DRIFT"
          >
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[7px] sm:text-[8px] font-bold mt-0.5 font-chakra">DRIFT</span>
          </button>

          {/* Boost */}
          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchBoost = true; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchBoost = false; })}
            onTouchCancel={() => { inputManager.touchBoost = false; }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-600/70 active:bg-cyan-400 backdrop-blur-md border border-cyan-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform touch-none"
            aria-label="BOOST"
          >
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[7px] sm:text-[8px] font-bold mt-0.5 font-chakra">BOOST</span>
          </button>

          {/* Brake / Reverse */}
          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchBrake = 1; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchBrake = 0; })}
            onTouchCancel={() => { inputManager.touchBrake = 0; }}
            className="w-13 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/80 active:bg-red-600 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center shadow-2xl active:scale-90 transition-transform font-bold text-xs touch-none"
            aria-label="BRAKE"
          >
            <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            <span className="text-[8px] sm:text-[9px] mt-0.5 font-chakra">BRAKE</span>
          </button>

          {/* Accelerate Gas */}
          <button
            onTouchStart={(e) => handleTouch(e, () => { inputManager.touchThrottle = 1; })}
            onTouchEnd={(e) => handleTouch(e, () => { inputManager.touchThrottle = 0; })}
            onTouchCancel={() => { inputManager.touchThrottle = 0; }}
            className="w-15 h-16 sm:w-18 sm:h-20 rounded-2xl bg-gradient-to-t from-red-600 to-red-500 active:from-red-500 active:to-red-400 text-white flex flex-col items-center justify-center shadow-[0_0_20px_rgba(225,6,0,0.5)] border border-red-400 active:scale-95 transition-transform font-black italic text-sm font-orbitron touch-none"
            aria-label="GAS"
          >
            <span>GAS</span>
            <span className="text-[7px] sm:text-[8px] tracking-widest uppercase opacity-80 font-chakra">RACE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default TouchControls;
