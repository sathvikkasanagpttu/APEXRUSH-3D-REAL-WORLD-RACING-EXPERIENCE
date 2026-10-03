import React from 'react';
import { SettingsConfig } from '../data/gameTypes';
import { X, Monitor, Volume2, Gamepad2, Video } from 'lucide-react';
import { audio } from '../audio/AudioEngine';

interface SettingsModalProps {
  settings: SettingsConfig;
  onUpdateSettings: (settings: SettingsConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const update = (patch: Partial<SettingsConfig>) => {
    const updated = { ...settings, ...patch };
    onUpdateSettings(updated);
    audio.setVolumes(
      updated.masterVolume,
      updated.engineVolume,
      updated.effectsVolume,
      updated.musicVolume
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="bg-zinc-950/90 border border-white/15 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-sm"></span>
            <h3 className="text-xl font-black italic text-white font-orbitron">SYSTEM SETTINGS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto max-h-[70vh] pr-1">
          {/* Graphics Quality */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-orbitron mb-2.5">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>GRAPHICS PRESET</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'ULTRA'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => update({ graphicsQuality: q })}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    settings.graphicsQuality === q
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-3">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shadows}
                  onChange={e => update({ shadows: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-0"
                />
                <span>Dynamic Shadows</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.particles}
                  onChange={e => update({ particles: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-0"
                />
                <span>Smoke & Sparks</span>
              </label>
            </div>
          </div>

          {/* Audio Levels */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-orbitron mb-2.5">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>AUDIO MIXER</span>
            </div>
            <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-xl border border-white/5">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 font-bold mb-1">
                  <span>MASTER VOLUME</span>
                  <span>{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.masterVolume}
                  onChange={e => update({ masterVolume: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 font-bold mb-1">
                  <span>ENGINE ROAR</span>
                  <span>{Math.round(settings.engineVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.engineVolume}
                  onChange={e => update({ engineVolume: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-zinc-400 font-bold mb-1">
                  <span>RACING SOUNDTRACK</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={e => update({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Camera Settings */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 font-orbitron mb-2.5">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>CAMERA & IMMERSION</span>
            </div>
            <div className="flex flex-col gap-3 bg-zinc-900/60 p-4 rounded-xl border border-white/5">
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Speed Camera Shake & Rumble</span>
                <input
                  type="checkbox"
                  checked={settings.cameraShake}
                  onChange={e => update({ cameraShake: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-red-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic py-3 rounded-xl font-orbitron cursor-pointer shadow-lg active:scale-98 transition-all"
        >
          CONFIRM & SAVE
        </button>
      </div>
    </div>
  );
};
