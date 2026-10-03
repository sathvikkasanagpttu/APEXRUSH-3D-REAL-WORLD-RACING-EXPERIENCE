import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface RacingCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
}

export const RacingCanvas: React.FC<RacingCanvasProps> = ({ onEngineReady }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Verify WebGL availability
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGlError('WebGL could not be initialized. Try enabling hardware acceleration or using a supported browser.');
      return;
    }

    try {
      const engine = new GameEngine(canvas);
      engineRef.current = engine;
      onEngineReady(engine);
    } catch (err) {
      console.error('Failed to initialize 3D GameEngine:', err);
      setWebGlError('WebGL could not be initialized. Try enabling hardware acceleration or using a supported browser.');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  if (webGlError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 p-6 z-50 select-none font-chakra">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/40 rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(225,6,0,0.5)] flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black italic font-orbitron text-white">WEBGL HARDWARE ERROR</h2>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              {webGlError}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic py-3 rounded-xl shadow-lg border border-red-400/40 flex items-center justify-center gap-2 cursor-pointer font-orbitron tracking-wider transition-all active:scale-95 text-xs sm:text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY INITIALIZATION</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-black touch-none focus:outline-none"
      tabIndex={0}
    />
  );
};
export default RacingCanvas;
