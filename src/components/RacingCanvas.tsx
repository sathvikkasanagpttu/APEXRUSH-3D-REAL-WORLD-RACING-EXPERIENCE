import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine';

interface RacingCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
}

export const RacingCanvas: React.FC<RacingCanvasProps> = ({ onEngineReady }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    onEngineReady(engine);

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block bg-black touch-none focus:outline-none"
      tabIndex={0}
    />
  );
};
