import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface LoadingScreenProps {
  onStart: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onStart }) => {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('INITIALIZING ENGINE...');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const steps = [
      { p: 25, text: 'LOADING WORLD ENVIRONMENT...' },
      { p: 55, text: 'CALIBRATING VEHICLE DYNAMICS...' },
      { p: 80, text: 'COMPILING TRACK GEOMETRY & SHADERS...' },
      { p: 100, text: 'APEXRUSH READY' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStageText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    audio.init();
    audio.resume();
    audio.playGearShift();
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-zinc-950 select-none overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="relative z-10 text-center mt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase mb-3 font-chakra">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          REAL-WORLD RACING EXPERIENCE
        </div>
        <h1 className="text-6xl sm:text-7xl font-black italic tracking-tighter text-white font-orbitron drop-shadow-[0_0_35px_rgba(255,255,255,0.25)]">
          APEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">RUSH</span> 3D
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase mt-1 font-rajdhani">
          NEXT-GEN BROWSER MOTORSPORT
        </p>
      </div>

      {/* Center Action / Progress */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full mb-12">
        {isReady ? (
          <button
            onClick={handleStart}
            className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black italic text-xl px-12 py-4 rounded-2xl shadow-[0_0_40px_rgba(225,6,0,0.7)] border border-red-400/50 flex items-center gap-4 cursor-pointer transition-all hover:scale-105 active:scale-95 font-orbitron animate-pulse"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>PRESS START</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest font-chakra">
              <span>{stageText}</span>
              <span className="text-red-400 font-orbitron">{progress}%</span>
            </div>
            <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_#e10600]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Specs */}
      <div className="relative z-10 flex justify-between w-full max-w-4xl text-[10px] text-zinc-500 uppercase tracking-widest font-chakra border-t border-white/5 pt-4">
        <span>THREE.JS ENGINE // 60 FPS WEBGL</span>
        <span>ARCADE-SIMULATION PHYSICS</span>
        <span>DYNAMIC PBR ENVIRONMENT</span>
      </div>
    </div>
  );
};
