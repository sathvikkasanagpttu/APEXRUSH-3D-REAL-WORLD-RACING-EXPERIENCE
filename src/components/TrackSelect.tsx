import React, { useState } from 'react';
import { GameMode, TimeOfDay, TrackConfig, WeatherType } from '../data/gameTypes';
import { CHAMPIONSHIP_RACES } from '../data/championshipData';
import { ArrowLeft, Play, Sun, CloudRain, Moon, Flag, Compass, Flame } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface TrackSelectProps {
  onStartTrack: (config: TrackConfig, mode: GameMode) => void;
  onBack: () => void;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({ onStartTrack, onBack }) => {
  const [selectedRace, setSelectedRace] = useState(CHAMPIONSHIP_RACES[0]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('QUICK_RACE');
  const [weather, setWeather] = useState<WeatherType>(CHAMPIONSHIP_RACES[0].weather);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(CHAMPIONSHIP_RACES[0].timeOfDay);
  const [lapCount, setLapCount] = useState<number>(3);

  const handleLaunch = () => {
    audio.playGearShift();
    onStartTrack(
      {
        ...selectedRace,
        weather,
        timeOfDay,
        totalLaps: lapCount,
      },
      selectedMode
    );
  };

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 sm:p-10 pointer-events-none">
      {/* Header */}
      <div className="pointer-events-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-95 font-rajdhani"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MENU</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">CIRCUIT HUB</span>
          <h2 className="text-2xl sm:text-3xl font-black italic text-white font-orbitron">TRACK SELECTION</h2>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="pointer-events-auto flex flex-col lg:flex-row gap-6 my-auto max-w-6xl w-full mx-auto">
        {/* Left: Track Cards List */}
        <div className="flex-1 flex flex-col gap-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AVAILABLE CIRCUITS</span>
          {CHAMPIONSHIP_RACES.map(race => (
            <div
              key={race.id}
              onClick={() => {
                audio.playGearShift();
                setSelectedRace(race);
                setWeather(race.weather);
                setTimeOfDay(race.timeOfDay);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                selectedRace.id === race.id
                  ? 'bg-red-600/20 border-red-500 shadow-[0_0_20px_rgba(225,6,0,0.4)]'
                  : 'bg-black/60 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-black italic text-white font-orbitron">{race.name}</div>
                  <div className="text-xs text-zinc-400 font-rajdhani font-semibold">{race.subtitle}</div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      race.difficulty === 'EASY'
                        ? 'border-emerald-500/40 text-emerald-400'
                        : race.difficulty === 'MEDIUM'
                        ? 'border-amber-500/40 text-amber-400'
                        : 'border-red-500/40 text-red-400'
                    }`}
                  >
                    {race.difficulty}
                  </span>
                  <div className="text-[10px] text-zinc-400 mt-1">RECORD: {race.bestLapRecord}s</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Race Mode, Atmosphere & Launch Configuration */}
        <div className="w-full lg:w-96 bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">GAME MODE</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'QUICK_RACE', label: 'QUICK RACE', icon: Flag },
                    { id: 'TIME_TRIAL', label: 'TIME TRIAL', icon: Play },
                    { id: 'DRIFT_MODE', label: 'DRIFT MODE', icon: Flame },
                    { id: 'FREE_DRIVE', label: 'FREE DRIVE', icon: Compass },
                  ] as const
                ).map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        audio.playGearShift();
                        setSelectedMode(m.id);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        selectedMode === m.id
                          ? 'bg-red-600 border-red-400 text-white shadow-lg'
                          : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold font-orbitron">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Atmosphere (Weather & Time) */}
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">CONDITIONS</span>
              <div className="flex gap-2">
                {(['SUNNY', 'RAIN', 'STORM', 'NIGHT'] as WeatherType[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setWeather(w)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border uppercase cursor-pointer ${
                      weather === w ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-zinc-900 border-white/10 text-zinc-400'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                {(['DAY', 'SUNSET', 'NIGHT', 'DAWN'] as TimeOfDay[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeOfDay(t)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border uppercase cursor-pointer ${
                      timeOfDay === t ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-zinc-900 border-white/10 text-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Lap Count */}
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">LAPS</span>
              <div className="flex gap-3">
                {[1, 3, 5].map(l => (
                  <button
                    key={l}
                    onClick={() => setLapCount(l)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      lapCount === l ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-900 border-white/10 text-zinc-400'
                    }`}
                  >
                    {l} {l === 1 ? 'LAP' : 'LAPS'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            onClick={handleLaunch}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black italic text-lg py-3.5 rounded-xl shadow-[0_0_25px_rgba(225,6,0,0.6)] border border-red-400/40 flex items-center justify-center gap-3 transition-all cursor-pointer font-orbitron hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>ENTER TRACK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
