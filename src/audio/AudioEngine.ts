// ApexRush 3D - High-performance Web Audio Synthesizer Engine

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Volumes
  private masterGain: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private oscSub: OscillatorNode | null = null;
  private oscMain: OscillatorNode | null = null;
  private oscHarmonic: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Tire squeal nodes
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  private skidSource: AudioBufferSourceNode | null = null;

  // Wind / Speed whoosh
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Boost noise
  private boostGain: GainNode | null = null;

  // Music sequencer
  private musicTimer: number | null = null;
  private step = 0;
  private isMusicPlaying = false;

  // Volume settings (0..1)
  private masterVol = 0.8;
  private engineVol = 0.7;
  private sfxVol = 0.8;
  private musicVol = 0.5;

  constructor() {
    // Autoplay unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.init();
        this.resume();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Sub-busses
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.engineVol, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupSkidSynth();
      this.setupWindSynth();
      this.setupBoostSynth();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  resume() {
    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {}
  }

  private setupEngineSynth() {
    try {
      if (!this.ctx || !this.engineGain) return;

      // Sub oscillator (rumble)
      this.oscSub = this.ctx.createOscillator();
      this.oscSub.type = 'triangle';
      this.oscSub.frequency.setValueAtTime(55, this.ctx.currentTime);

      // Main oscillator (v8 roar)
      this.oscMain = this.ctx.createOscillator();
      this.oscMain.type = 'sawtooth';
      this.oscMain.frequency.setValueAtTime(110, this.ctx.currentTime);

      // High harmonic
      this.oscHarmonic = this.ctx.createOscillator();
      this.oscHarmonic.type = 'sawtooth';
      this.oscHarmonic.frequency.setValueAtTime(165, this.ctx.currentTime);

      // Lowpass filter
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.oscSub.connect(subGain);
      subGain.connect(this.engineFilter);

      const mainGain = this.ctx.createGain();
      mainGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.oscMain.connect(mainGain);
      mainGain.connect(this.engineFilter);

      const harmGain = this.ctx.createGain();
      harmGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.oscHarmonic.connect(harmGain);
      harmGain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);

      this.oscSub.start();
      this.oscMain.start();
      this.oscHarmonic.start();
    } catch (e) {
      console.warn('setupEngineSynth error:', e);
    }
  }

  private setupSkidSynth() {
    try {
      if (!this.ctx || !this.sfxGain) return;

      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.skidSource = this.ctx.createBufferSource();
      this.skidSource.buffer = noiseBuffer;
      this.skidSource.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(5, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.skidSource.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.sfxGain);

      this.skidSource.start();
    } catch (e) {
      console.warn('setupSkidSynth error:', e);
    }
  }

  private setupWindSynth() {
    try {
      if (!this.ctx || !this.sfxGain) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const windSource = this.ctx.createBufferSource();
      windSource.buffer = noiseBuffer;
      windSource.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.sfxGain);

      windSource.start();
    } catch (e) {
      console.warn('setupWindSynth error:', e);
    }
  }

  private setupBoostSynth() {
    try {
      if (!this.ctx || !this.sfxGain) return;
      this.boostGain = this.ctx.createGain();
      this.boostGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.boostGain.connect(this.sfxGain);
    } catch {}
  }

  updateEngine(rpm: number, throttle: number, speedKmh: number) {
    try {
      if (!this.ctx || !this.isInitialized) return;

      const now = this.ctx.currentTime;
      const safeRpm = Math.max(800, Math.min(9000, Number.isFinite(rpm) ? rpm : 800));
      const safeThrottle = Math.max(0, Math.min(1, Number.isFinite(throttle) ? throttle : 0));
      const safeSpeed = Math.max(0, Number.isFinite(speedKmh) ? speedKmh : 0);
      const baseFreq = 35 + (safeRpm / 8500) * 160;

      if (this.oscSub) {
        this.oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.05);
      }
      if (this.oscMain) {
        this.oscMain.frequency.setTargetAtTime(baseFreq, now, 0.05);
      }
      if (this.oscHarmonic) {
        this.oscHarmonic.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
      }

      if (this.engineFilter) {
        const cutoff = 300 + safeThrottle * 1200 + (safeRpm / 8500) * 2200;
        this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.05);
      }

      // Wind noise based on speed
      if (this.windGain && this.windFilter) {
        const windVol = Math.min(0.4, (safeSpeed / 280) * 0.4);
        this.windGain.gain.setTargetAtTime(windVol, now, 0.1);
        this.windFilter.frequency.setTargetAtTime(200 + (safeSpeed / 280) * 1200, now, 0.1);
      }
    } catch {}
  }

  setTireSqueal(intensity: number) {
    try {
      if (!this.ctx || !this.skidGain) return;
      const clamped = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0));
      this.skidGain.gain.setTargetAtTime(clamped * 0.45, this.ctx.currentTime, 0.05);
    } catch {}
  }

  setBoostActive(active: boolean) {
    try {
      if (!this.ctx || !this.boostGain || !this.sfxGain) return;
      if (active) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      }
    } catch {}
  }

  playCollision(impactForce: number) {
    try {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

      const vol = Math.min(0.8, (Number.isFinite(impactForce) ? impactForce : 0.4) * 0.5);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(now + 0.25);
    } catch {}
  }

  playGearShift() {
    try {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(now + 0.08);
    } catch {}
  }

  playCountdown(count: number) {
    try {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (count > 0) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(now + 0.2);
      } else {
        // GO!
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(920, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(now + 0.6);
      }
    } catch {}
  }

  playCheckpoint() {
    try {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.18, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.25);
      });
    } catch {}
  }

  playFinish() {
    try {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } catch {}
  }

  startMusic() {
    try {
      if (!this.ctx || this.isMusicPlaying) return;
      this.isMusicPlaying = true;
      const bpm = 128;
      const stepTime = (60 / bpm) / 4; // 16th note
      const bassNotes = [65.41, 65.41, 77.78, 65.41, 87.31, 77.78, 65.41, 98.0];

      const runStep = () => {
        try {
          if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
          const now = this.ctx.currentTime;

          // Bass note on 16th step
          const note = bassNotes[this.step % bassNotes.length];
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note, now);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 0.9);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320 + ((this.step % 4) === 0 ? 300 : 0), now);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);

          osc.start(now);
          osc.stop(now + stepTime);

          // Kick drum on quarter notes
          if (this.step % 4 === 0) {
            const kickOsc = this.ctx.createOscillator();
            const kickGain = this.ctx.createGain();
            kickOsc.frequency.setValueAtTime(140, now);
            kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

            kickGain.gain.setValueAtTime(0.3, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            kickOsc.connect(kickGain);
            kickGain.connect(this.musicGain);
            kickOsc.start(now);
            kickOsc.stop(now + 0.12);
          }

          // Hi-hat on offbeats
          if (this.step % 2 === 1) {
            const hhOsc = this.ctx.createOscillator();
            const hhGain = this.ctx.createGain();
            hhOsc.type = 'triangle';
            hhOsc.frequency.setValueAtTime(5000 + Math.random() * 1000, now);
            hhGain.gain.setValueAtTime(0.03, now);
            hhGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            hhOsc.connect(hhGain);
            hhGain.connect(this.musicGain);
            hhOsc.start(now);
            hhOsc.stop(now + 0.04);
          }

          this.step = (this.step + 1) % 64;
          this.musicTimer = window.setTimeout(runStep, stepTime * 1000);
        } catch {}
      };

      runStep();
    } catch {}
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setVolumes(master: number, engine: number, sfx: number, music: number) {
    this.masterVol = Number.isFinite(master) ? Math.max(0, Math.min(1, master)) : 0.8;
    this.engineVol = Number.isFinite(engine) ? Math.max(0, Math.min(1, engine)) : 0.7;
    this.sfxVol = Number.isFinite(sfx) ? Math.max(0, Math.min(1, sfx)) : 0.8;
    this.musicVol = Number.isFinite(music) ? Math.max(0, Math.min(1, music)) : 0.5;

    try {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.masterVol, now, 0.05);
      if (this.engineGain) this.engineGain.gain.setTargetAtTime(this.engineVol, now, 0.05);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.sfxVol, now, 0.05);
      if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.musicVol, now, 0.05);
    } catch {}
  }
}

export const audio = new AudioEngine();
