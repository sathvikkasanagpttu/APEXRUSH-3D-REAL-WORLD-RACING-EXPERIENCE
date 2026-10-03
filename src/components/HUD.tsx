import React from 'react';
import { MiniMap } from './MiniMap';
import { BuiltTrack } from '../tracks/TrackBuilder';
import { Vehicle } from '../vehicles/Vehicle';
import { AIOpponent } from '../ai/AIOpponent';
import { CameraMode } from '../data/gameTypes';
import { Gauge, Zap, Flame, ShieldAlert, Fuel, Camera, Flag } from 'lucide-react';

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
  const {
    speedKmh,
    rpm,
    gear,
    boost,
    fuel,
    damage,
    lap,
    totalLaps,
    position,
    totalRacers,
    currentLapTime,
    bestLapTime,
    totalRaceTime,
    countdown,
    notifications,
    driftScore,
    driftCombo,
    isDrifting,
    zoneName,
  } = telemetry;

  const rpmPercent = Math.min(100, (rpm / 8500) * 100);
  const gearDisplay = gear === 0 ? 'R' : gear.toString();

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* --- TOP ROW --- */}
      <div className="flex justify-between items-start">
        {/* Top-Left: Lap, Time, Sector */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Flag className="w-3 h-3 text-red-500" /> LAP
              </span>
              <span className="text-2xl font-black text-white italic font-orbitron">
                {lap} <span className="text-sm text-zinc-400 not-italic">/ {totalLaps}</span>
              </span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">CURRENT TIME</span>
              <span className="text-xl font-bold text-cyan-400 font-chakra">{currentLapTime}</span>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">BEST LAP</span>
              <span className="text-xl font-bold text-amber-400 font-chakra">{bestLapTime}</span>
            </div>
          </div>

          {/* Sector Zone Badge */}
          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-lg px-3 py-1 flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">{zoneName}</span>
          </div>
        </div>

        {/* Top-Center: Position Badge */}
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-b from-red-600 to-red-800 text-white px-6 py-2 rounded-2xl shadow-[0_0_25px_rgba(225,6,0,0.6)] border border-red-400/40 flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-widest uppercase text-red-200">POSITION</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black italic font-orbitron">{position}</span>
              <span className="text-lg text-red-200 font-bold">/ {totalRacers}</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Mini Map & Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={onCameraToggle}
              className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{cameraMode} [C]</span>
            </button>
            <button
              onClick={onPause}
              className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-lg active:scale-95"
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
            <span className="text-xl font-bold tracking-widest text-zinc-300 uppercase mt-2">GET READY</span>
          </div>
        )}

        {/* Drift Score Popup */}
        {isDrifting && (
          <div className="bg-black/80 backdrop-blur-md border-2 border-yellow-400/80 px-6 py-2 rounded-xl shadow-[0_0_30px_rgba(255,200,0,0.5)] flex items-center gap-3 animate-pulse">
            <Flame className="w-6 h-6 text-yellow-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">DRIFT BONUS</span>
              <span className="text-2xl font-black text-white italic font-orbitron">
                +{driftScore} <span className="text-sm text-yellow-400 font-bold">x{driftCombo}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- BOTTOM ROW --- */}
      <div className="flex justify-between items-end">
        {/* Bottom-Left: Race Notifications & Vehicle Status */}
        <div className="flex flex-col gap-2 max-w-xs">
          {/* Active Notifications Toast Queue */}
          <div className="flex flex-col gap-1.5 mb-2">
            {notifications.slice(-3).map(n => (
              <div
                key={n.id}
                className="bg-black/85 backdrop-blur-md border-l-4 rounded-r-lg px-3 py-1.5 shadow-xl transition-all animate-slide-in"
                style={{ borderColor: n.color || '#00f0ff' }}
              >
                <div className="text-xs font-black tracking-wider uppercase text-white font-orbitron">{n.text}</div>
                {n.subtext && <div className="text-[10px] text-zinc-400 font-bold tracking-wide">{n.subtext}</div>}
              </div>
            ))}
          </div>

          {/* Damage & Fuel Bars */}
          <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2">
            {/* Fuel */}
            <div className="flex items-center gap-2">
              <Fuel className="w-3.5 h-3.5 text-zinc-400" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
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
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase">
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
          <div className="bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-end min-w-[240px]">
            {/* Speed & Gear */}
            <div className="flex items-baseline gap-3">
              {/* Gear Indicator */}
              <div className="flex flex-col items-center bg-zinc-900 border border-white/10 rounded-xl px-3 py-1">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">GEAR</span>
                <span className="text-3xl font-black text-cyan-400 font-orbitron">{gearDisplay}</span>
              </div>

              {/* Speed Digits */}
              <div className="flex items-baseline">
                <span className="text-6xl sm:text-7xl font-black italic tracking-tighter text-white font-orbitron drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  {speedKmh}
                </span>
                <span className="text-sm font-bold text-zinc-400 ml-1 italic uppercase">KM/H</span>
              </div>
            </div>

            {/* RPM Gauge Bar */}
            <div className="w-full mt-3">
              <div className="flex justify-between text-[9px] font-bold text-zinc-400 tracking-wider mb-0.5">
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
            <div className="w-full mt-3">
              <div className="flex justify-between text-[9px] font-bold text-cyan-400 tracking-wider mb-0.5 flex items-center">
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
