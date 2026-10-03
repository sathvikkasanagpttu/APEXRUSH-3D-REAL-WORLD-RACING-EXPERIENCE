import React, { useState } from 'react';
import { CarCustomization, CarStats } from '../data/gameTypes';
import { COLOR_PALETTES, calculateCarStats } from '../data/garageData';
import { ArrowLeft, Check, Sparkles, Zap, Shield, RotateCcw } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface GarageProps {
  customization: CarCustomization;
  onUpdateCustomization: (customization: CarCustomization) => void;
  onBack: () => void;
}

type GarageTab = 'PAINT' | 'WHEELS' | 'AERO' | 'NEON' | 'BRAKES' | 'TUNING';

export const Garage: React.FC<GarageProps> = ({
  customization,
  onUpdateCustomization,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<GarageTab>('PAINT');
  const stats: CarStats = calculateCarStats(customization);

  const update = (patch: Partial<CarCustomization>) => {
    audio.playGearShift();
    onUpdateCustomization({ ...customization, ...patch });
  };

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
      {/* Top Header */}
      <div className="pointer-events-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 font-rajdhani"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MENU</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">PERFORMANCE GARAGE</span>
          <h2 className="text-2xl sm:text-3xl font-black italic text-white font-orbitron">APEX GT-R CUSTOMS</h2>
        </div>
      </div>

      {/* Center Right: Performance Stat Bars */}
      <div className="pointer-events-auto self-end max-w-xs w-full bg-black/80 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 my-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-black text-white uppercase tracking-wider font-orbitron">VEHICLE TELEMETRY</span>
          <span className="text-xs text-red-500 font-bold font-chakra">CLASS A</span>
        </div>

        {/* Speed */}
        <div>
          <div className="flex justify-between text-xs font-bold text-zinc-300 font-chakra mb-1">
            <span>TOP SPEED</span>
            <span className="text-cyan-400">{stats.speed} / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${stats.speed}%` }}></div>
          </div>
        </div>

        {/* Acceleration */}
        <div>
          <div className="flex justify-between text-xs font-bold text-zinc-300 font-chakra mb-1">
            <span>ACCELERATION</span>
            <span className="text-cyan-400">{stats.acceleration} / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${stats.acceleration}%` }}></div>
          </div>
        </div>

        {/* Handling */}
        <div>
          <div className="flex justify-between text-xs font-bold text-zinc-300 font-chakra mb-1">
            <span>HANDLING</span>
            <span className="text-cyan-400">{stats.handling} / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${stats.handling}%` }}></div>
          </div>
        </div>

        {/* Braking */}
        <div>
          <div className="flex justify-between text-xs font-bold text-zinc-300 font-chakra mb-1">
            <span>BRAKING</span>
            <span className="text-cyan-400">{stats.braking} / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${stats.braking}%` }}></div>
          </div>
        </div>

        {/* Grip */}
        <div>
          <div className="flex justify-between text-xs font-bold text-zinc-300 font-chakra mb-1">
            <span>CORNERING GRIP</span>
            <span className="text-cyan-400">{stats.grip} / 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full transition-all duration-300" style={{ width: `${stats.grip}%` }}></div>
          </div>
        </div>
      </div>

      {/* Bottom Customization Controls Panel */}
      <div className="pointer-events-auto bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-w-3xl">
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/10">
          {(['PAINT', 'WHEELS', 'AERO', 'NEON', 'BRAKES', 'TUNING'] as GarageTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                audio.playGearShift();
                setActiveTab(tab);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wider font-orbitron transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[110px] flex items-center">
          {/* 1. PAINT */}
          {activeTab === 'PAINT' && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">BODY COLOR FINISH</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTES.body.map(c => (
                  <button
                    key={c.name}
                    onClick={() => update({ bodyColor: c.value })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/40 cursor-pointer bg-zinc-900/80 transition-all active:scale-95"
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c.value }}></span>
                    <span className="text-xs text-white font-medium">{c.name}</span>
                    {customization.bodyColor === c.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>

              {/* Paint Finish */}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-zinc-400 font-bold uppercase">FINISH:</span>
                {(['metallic', 'gloss', 'matte'] as const).map(fin => (
                  <button
                    key={fin}
                    onClick={() => update({ paintFinish: fin })}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase cursor-pointer ${
                      customization.paintFinish === fin ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {fin}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. WHEELS */}
          {activeTab === 'WHEELS' && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">FORGED ALLOY RIM FINISH</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTES.rims.map(r => (
                  <button
                    key={r.name}
                    onClick={() => update({ rimColor: r.value })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/40 cursor-pointer bg-zinc-900/80 transition-all active:scale-95"
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: r.value }}></span>
                    <span className="text-xs text-white font-medium">{r.name}</span>
                    {customization.rimColor === r.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. AERO / SPOILER */}
          {activeTab === 'AERO' && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">REAR SPOILER & DOWNFORCE</span>
              <div className="flex gap-3">
                {[
                  { style: 0, label: 'CLEAN SPOILER-LESS', desc: 'Minimal drag, street profile' },
                  { style: 1, label: 'SPORT CARBON WING', desc: 'Balanced downforce and top speed' },
                  { style: 2, label: 'GT COMPETITION WING', desc: 'Maximum cornering high-downforce' },
                ].map(opt => (
                  <button
                    key={opt.style}
                    onClick={() => update({ spoilerStyle: opt.style })}
                    className={`flex-1 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      customization.spoilerStyle === opt.style
                        ? 'bg-red-600/20 border-red-500 text-white'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-black font-orbitron">{opt.label}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. NEON UNDERGLOW */}
          {activeTab === 'NEON' && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">CHASSIS NEON UNDERGLOW</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTES.neon.map(n => (
                  <button
                    key={n.name}
                    onClick={() => update({ neonColor: n.value })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/40 cursor-pointer bg-zinc-900/80 transition-all active:scale-95"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: n.value === 'transparent' ? '#333' : n.value }}
                    ></span>
                    <span className="text-xs text-white font-medium">{n.name}</span>
                    {customization.neonColor === n.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. BRAKES */}
          {activeTab === 'BRAKES' && (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">CERAMIC BRAKE CALIPER FINISH</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTES.brakes.map(b => (
                  <button
                    key={b.name}
                    onClick={() => update({ brakeColor: b.value })}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/40 cursor-pointer bg-zinc-900/80 transition-all active:scale-95"
                  >
                    <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: b.value }}></span>
                    <span className="text-xs text-white font-medium">{b.name}</span>
                    {customization.brakeColor === b.value && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. TUNING */}
          {activeTab === 'TUNING' && (
            <div className="flex gap-4 w-full">
              {/* Engine stage */}
              <div className="flex-1 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">TWIN-TURBO ECU</span>
                <div className="text-sm font-bold text-white mt-1">STAGE {customization.engineLevel}</div>
                <button
                  onClick={() => update({ engineLevel: customization.engineLevel === 3 ? 1 : customization.engineLevel + 1 })}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded cursor-pointer font-bold"
                >
                  UPGRADE
                </button>
              </div>

              {/* Tires */}
              <div className="flex-1 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">RACING COMPOUND</span>
                <div className="text-sm font-bold text-white mt-1">STAGE {customization.tireLevel}</div>
                <button
                  onClick={() => update({ tireLevel: customization.tireLevel === 3 ? 1 : customization.tireLevel + 1 })}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded cursor-pointer font-bold"
                >
                  UPGRADE
                </button>
              </div>

              {/* Brakes */}
              <div className="flex-1 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">CARBON BRAKES</span>
                <div className="text-sm font-bold text-white mt-1">STAGE {customization.brakeLevel}</div>
                <button
                  onClick={() => update({ brakeLevel: customization.brakeLevel === 3 ? 1 : customization.brakeLevel + 1 })}
                  className="mt-2 text-xs bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded cursor-pointer font-bold"
                >
                  UPGRADE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
