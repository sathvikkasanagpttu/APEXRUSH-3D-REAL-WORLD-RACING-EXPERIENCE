import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BuiltTrack } from '../tracks/TrackBuilder';
import { Vehicle } from '../vehicles/Vehicle';
import { AIOpponent } from '../ai/AIOpponent';

interface MiniMapProps {
  track: BuiltTrack | null;
  player: Vehicle | null;
  aiOpponents: AIOpponent[];
}

export const MiniMap: React.FC<MiniMapProps> = ({ track, player, aiOpponents }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let isCancelled = false;

    const render = () => {
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (!canvas || !track || !player) {
        animId = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Track bounding box mapping to canvas
      // Track bounds roughly X: [-220..380], Z: [-320..270]
      const minX = -240;
      const maxX = 400;
      const minZ = -330;
      const maxZ = 280;

      const toScreenX = (x: number) => ((x - minX) / (maxX - minX)) * (w - 24) + 12;
      const toScreenY = (z: number) => ((z - minZ) / (maxZ - minZ)) * (h - 24) + 12;

      // Draw track ribbon
      ctx.beginPath();
      const samples = 120;
      for (let i = 0; i <= samples; i++) {
        const pt = track.curve.getPointAt(i / samples);
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.z);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Checkpoints
      track.checkpoints.forEach((cp, idx) => {
        if (idx % 3 === 0) {
          const cx = toScreenX(cp.position.x);
          const cy = toScreenY(cp.position.z);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Start/Finish Line
      const startPt = track.curve.getPointAt(0);
      const sfx = toScreenX(startPt.x);
      const sfy = toScreenY(startPt.z);
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(sfx, sfy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw AI Opponents
      aiOpponents.forEach(ai => {
        const ax = toScreenX(ai.position.x);
        const ay = toScreenY(ai.position.z);
        ctx.fillStyle = ai.profile.color || '#ff4444';
        ctx.beginPath();
        ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Car (Bright Cyan with heading pointer)
      const pPos = player.physics.position;
      const px = toScreenX(pPos.x);
      const py = toScreenY(pPos.z);

      ctx.save();
      ctx.translate(px, py);

      // Player glow
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [track, player, aiOpponents]);

  return (
    <div className="relative p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1 px-1">
        <span>TRACK MAP</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          LIVE GPS
        </span>
      </div>
      <canvas ref={canvasRef} width={180} height={180} className="rounded-lg w-[160px] h-[160px]" />
    </div>
  );
};
