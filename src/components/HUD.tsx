import React from 'react';
import { MiniMap } from './MiniMap';
import { BuiltTrack } from '../tracks/TrackBuilder';
import { Vehicle } from '../vehicles/Vehicle';
import { AIOpponent } from '../ai/AIOpponent';
import { CameraMode } from '../data/gameTypes';
import { Zap, Flame, ShieldAlert, Fuel, Camera, Flag, Clock, Timer } from 'lucide-react';

interface HUDProps {
  telemetry: {
    speedKmh: number;
    rpm: number;
    gear: number;
    boost: number;
    fuel: number;
    damage: number;
    lap: number;
    totalLaps: number;
    position: number;
    totalRacers: number;
    currentLapTime: string;
    bestLapTime: string;
    totalRaceTime: string;
    countdown: number;
    notifications: { id: string; text: string; subtext?: string; color?: string }[];
    driftScore: number;
    driftCombo: number;
    isDrifting: boolean;
    zoneName: string;
  };
  track: BuiltTrack | null;
  player: Vehicle | null;
  aiOpponents: AIOpponent[];
  cameraMode: CameraMode;
  onCameraToggle: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  track,
  player,
  aiOpponents,
  cameraMode,
  onCameraToggle,
  onPause,
}) => {
  // Defensive values to guarantee NaN / undefined / Infinity / null NEVER appear (Req 24)
  const speedKmh = Number.isFinite(telemetry.speedKmh) ? Math.max(0, Math.round(telemetry.speedKmh)) : 0;
  const rpm = Number.isFinite(telemetry.rpm) ? Math.max(0, Math.round(telemetry.rpm)) : 900;
  const gear = Number.isFinite(telemetry.gear) ? telemetry.gear : 1;
  const boost = Number.isFinite(telemetry.boost) ? Math.max(0, Math.min(100, Math.round(telemetry.boost))) : 100;
  const fuel = Number.isFinite(telemetry.fuel) ? Math.max(0, Math.min(100, Math.round(telemetry.fuel))) : 100;
  const damage = Number.isFinite(telemetry.damage) ? Math.max(0, Math.min(100, Math.round(telemetry.damage))) : 0;
  const lap = Number.isFinite(telemetry.lap) ? Math.max(1, telemetry.lap) : 1;
  const totalLaps = Number.isFinite(telemetry.totalLaps) ? Math.max(1, telemetry.totalLaps) : 3;
  const position = Number.isFinite(telemetry.position) ? Math.max(1, telemetry.position) : 1;
  const totalRacers = Number.isFinite(telemetry.totalRacers) ? Math.max(1, telemetry.totalRacers) : 7;
  const currentLapTime = telemetry.currentLapTime || '00:00.000';
  const bestLapTime = telemetry.bestLapTime || '--:--.---';
  const totalRaceTime = telemetry.totalRaceTime || '00:00.000';
  const countdown = Number.isFinite(telemetry.countdown) ? telemetry.countdown : 0;
  const notifications = Array.isArray(telemetry.notifications) ? telemetry.notifications : [];
  const driftScore = Number.isFinite(telemetry.driftScore) ? Math.max(0, telemetry.driftScore) : 0;
  const driftCombo = Number.isFinite(telemetry.driftCombo) ? Math.max(1.0, telemetry.driftCombo) : 1.0;
  const isDrifting = !!telemetry.isDrifting;
  const zoneName = telemetry.zoneName || 'GRAND CIRCUIT';

  const rpmPercent = Math.min(100, (rpm / 8500) * 100);
  const gearDisplay = gear === 0 ? 'R' : gear.toString();
  const isFinalLap = lap === totalLaps;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-6 overflow-hidden">
      {/* --- TOP ROW --- */}
      <div className="flex justify-between items-start gap-2">
        {/* Top-Left: Lap, Sector, Current Lap, Best Lap, Total Time */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-2 shadow-2xl flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Lap Counter */}
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1 font-chakra">
                <Flag className="w-3 h-3 text-red-500" />
                {isFinalLap ? <span className="text-red-400 font-black animate-pulse">FINAL LAP</span> : 'LAP'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white italic font-orbitron">
                {lap} <span className="text-xs text-zinc-400 not-italic font-chakra">/ {totalLaps}</span>
              </span>
            </div>

            <div className="h-7 w-px bg-white/10"></div>

            {/* Current Lap Time */}
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-chakra flex items-center gap-1">
                <Timer className="w-3 h-3 text-cyan-400" /> CURRENT LAP
              </span>
              <span className="text-sm sm:text-lg font-bold text-cyan-400 font-mono tracking-tight">{currentLapTime}</span>
            </div>

            <div className="h-7 w-px bg-white/10 hidden sm:block"></div>

            {/* Best Lap Time */}
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-chakra">BEST LAP</span>
              <span className="text-sm sm:text-lg font-bold text-amber-400 font-mono tracking-tight">{bestLapTime}</span>
            </div>

            <div className="h-7 w-px bg-white/10 hidden md:block"></div>

            {/* Total Race Time */}
            <div className="flex flex-col hidden md:flex">
              <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest font-chakra flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" /> TOTAL TIME
              </span>
              <span className="text-sm sm:text-lg font-bold text-emerald-400 font-mono tracking-tight">{totalRaceTime}</span>
            </div>
          </div>

          {/* Sector Zone Badge */}
          <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-2.5 py-1 flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-300 uppercase tracking-widest font-chakra">{zoneName}</span>
          </div>
        </div>

        {/* Top-Center: Position Badge */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-b from-red-600 to-red-800 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl shadow-[0_0_25px_rgba(225,6,0,0.6)] border border-red-400/40 flex flex-col items-center">
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-red-200 font-chakra">POSITION</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black italic font-orbitron">P{position}</span>
              <span className="text-sm sm:text-lg text-red-200 font-bold font-chakra">/{totalRacers}</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Mini Map & Header Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCameraToggle}
              className="bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95 font-chakra"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{cameraMode} [C]</span>
            </button>
            <button
              onClick={onPause}
              className="bg-black/75 hover:bg-black/95 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-lg active:scale-95 font-chakra"
            >
              PAUSE [ESC]
            </button>
          </div>

          <MiniMap track={track} player={player} aiOpponents={aiOpponents} />
        </div>
      </div>

      {/* --- CENTER: COUNTDOWN & DRIFT NOTIFICATIONS --- */}
      <div className="flex flex-col items-center justify-center my-auto">
        {countdown > 0 && (
          <div className="flex flex-col items-center animate-bounce">
            <div className="text-8xl sm:text-9xl font-black italic font-orbitron text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_0_40px_rgba(255,100,0,0.8)]">
              {countdown}
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-widest text-zinc-300 uppercase mt-2 font-chakra">GET READY</span>
          </div>
        )}

        {/* Drift Score Popup */}
        {isDrifting && (
          <div className="bg-black/80 backdrop-blur-md border-2 border-yellow-400/80 px-5 sm:px-6 py-2 rounded-xl shadow-[0_0_30px_rgba(255,200,0,0.5)] flex items-center gap-3 animate-pulse">
            <Flame className="w-6 h-6 text-yellow-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider font-chakra">DRIFT BONUS</span>
              <span className="text-xl sm:text-2xl font-black text-white italic font-orbitron">
                +{driftScore} <span className="text-sm text-yellow-400 font-bold">x{driftCombo}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="flex justify-between items-end gap-2">
        {/* Bottom-Left: Race Notifications & Vehicle Status */}
        <div className="flex flex-col gap-2 max-w-xs w-full">
          {/* Active Notifications Toast Queue */}
          <div className="flex flex-col gap-1.5 mb-1">
            {notifications.slice(-3).map(n => (
              <div
                key={n.id}
                className="bg-black/85 backdrop-blur-md border-l-4 rounded-r-lg px-3 py-1.5 shadow-xl transition-all animate-slide-in"
                style={{ borderColor: n.color || '#00f0ff' }}
              >
                <div className="text-xs font-black tracking-wider uppercase text-white font-orbitron">{n.text}</div>
                {n.subtext && <div className="text-[10px] text-zinc-400 font-bold tracking-wide font-chakra">{n.subtext}</div>}
              </div>
            ))}
          </div>

          {/* Damage & Fuel Bars */}
          <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:p-3 shadow-2xl flex flex-col gap-2">
            {/* Fuel */}
            <div className="flex items-center gap-2">
              <Fuel className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase font-chakra">
                  <span>FUEL</span>
                  <span className={fuel < 20 ? 'text-red-400 animate-pulse' : 'text-zinc-300'}>{fuel}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-0.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${fuel < 20 ? 'bg-red-500' : 'bg-emerald-400'}`}
                    style={{ width: `${fuel}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Damage */}
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase font-chakra">
                  <span>DAMAGE</span>
                  <span className={damage > 50 ? 'text-red-400 animate-pulse' : 'text-zinc-300'}>{damage}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-0.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${damage > 50 ? 'bg-red-500' : 'bg-amber-400'}`}
                    style={{ width: `${damage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Motorsport Digital Instrument Cluster */}
        <div className="flex flex-col items-end">
          <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-3.5 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-end min-w-[200px] sm:min-w-[240px]">
            {/* Speed & Gear */}
            <div className="flex items-baseline gap-2.5 sm:gap-3">
              {/* Gear Indicator */}
              <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-2.5 sm:px-3 py-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-chakra">GEAR</span>
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-orbitron">{gearDisplay}</span>
              </div>

              {/* Speed Digits */}
              <div className="flex items-baseline">
                <span className="text-5xl sm:text-7xl font-black italic tracking-tighter text-white font-orbitron drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  {speedKmh}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-400 ml-1 italic uppercase font-chakra">KM/H</span>
              </div>
            </div>

            {/* RPM Gauge Bar */}
            <div className="w-full mt-2.5 sm:mt-3">
              <div className="flex justify-between text-[9px] font-bold text-zinc-400 tracking-wider mb-0.5 font-chakra">
                <span>0 RPM</span>
                <span className="text-red-400">8500 REDLINE</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden flex p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500"
                  style={{ width: `${rpmPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Nitro Boost Bar */}
            <div className="w-full mt-2.5 sm:mt-3">
              <div className="flex justify-between text-[9px] font-bold text-cyan-400 tracking-wider mb-0.5 flex items-center font-chakra">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" /> NITRO BOOST [SHIFT]
                </span>
                <span>{boost}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden flex p-0.5 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <div
                  className="h-full rounded-full transition-all duration-100 bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_12px_#00f0ff]"
                  style={{ width: `${boost}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HUD;
