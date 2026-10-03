import React, { useEffect, useRef } from 'react';
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

      const toScreenX = (x: number) => {
        if (!Number.isFinite(x)) return w / 2;
        return ((x - minX) / (maxX - minX)) * (w - 24) + 12;
      };
      const toScreenY = (z: number) => {
        if (!Number.isFinite(z)) return h / 2;
        return ((z - minZ) / (maxZ - minZ)) * (h - 24) + 12;
      };

      // 1. Draw track ribbon
      if (track.curve) {
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 2. Draw Checkpoints and Checkpoint Progress (Req 25)
      if (Array.isArray(track.checkpoints)) {
        track.checkpoints.forEach((cp, idx) => {
          if (!cp || !cp.position) return;
          const cx = toScreenX(cp.position.x);
          const cy = toScreenY(cp.position.z);

          if (idx === 0) {
            // Start/finish line
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (idx % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.beginPath();
            ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 3. Draw AI Opponents with defensive checks
      if (Array.isArray(aiOpponents)) {
        aiOpponents.forEach(ai => {
          if (!ai || !ai.position || !Number.isFinite(ai.position.x) || !Number.isFinite(ai.position.z)) {
            return;
          }
          const ax = toScreenX(ai.position.x);
          const ay = toScreenY(ai.position.z);
          ctx.fillStyle = ai.profile?.color || '#ff4444';
          ctx.beginPath();
          ctx.arc(ax, ay, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 4. Draw Player Car (Bright Cyan with glow)
      if (player && player.physics && player.physics.position && Number.isFinite(player.physics.position.x)) {
        const pPos = player.physics.position;
        const px = toScreenX(pPos.x);
        const py = toScreenY(pPos.z);

        ctx.save();
        ctx.translate(px, py);

        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
    };
  }, [track, player, aiOpponents]);

  return (
    <div className="relative p-2 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between text-[9px] text-cyan-400 font-bold uppercase tracking-wider mb-1 px-1 font-chakra">
        <span>TRACK MAP</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          LIVE GPS
        </span>
      </div>
      <canvas ref={canvasRef} width={180} height={180} className="rounded-lg w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]" />
    </div>
  );
};
export default MiniMap;
