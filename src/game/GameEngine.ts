import * as THREE from 'three';
import { CameraSystem } from '../camera/CameraSystem';
import { LightingSystem } from '../environment/LightingSystem';
import { EnvironmentBuilder, AnimatedProp } from '../environment/EnvironmentBuilder';
import { TrackBuilder, BuiltTrack } from '../tracks/TrackBuilder';
import { Vehicle } from '../vehicles/Vehicle';
import { AIOpponent, AI_ROSTER } from '../ai/AIOpponent';
import { ParticleManager } from '../particles/ParticleManager';
import { SkidMarkManager } from '../particles/SkidMarkManager';
import { InputManager } from '../systems/InputManager';
import { RaceManager } from './RaceManager';
import { CarCustomization, GameMode, GameState, SettingsConfig, TrackConfig } from '../data/gameTypes';
import { calculateCarStats, DEFAULT_CAR_CUSTOMIZATION } from '../data/garageData';
import { audio } from '../audio/AudioEngine';

export class GameEngine {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraSystem: CameraSystem;
  public lightingSystem: LightingSystem;
  public track: BuiltTrack;
  public environmentProps: AnimatedProp[] = [];

  public playerVehicle: Vehicle;
  public aiOpponents: AIOpponent[] = [];
  public particles: ParticleManager;
  public skidMarks: SkidMarkManager;
  public input: InputManager;
  public raceManager: RaceManager;

  public customization: CarCustomization = { ...DEFAULT_CAR_CUSTOMIZATION };
  public settings: SettingsConfig = {
    graphicsQuality: 'HIGH',
    shadows: true,
    particles: true,
    postProcessing: true,
    masterVolume: 0.8,
    engineVolume: 0.7,
    effectsVolume: 0.8,
    musicVolume: 0.5,
    cameraFov: 65,
    cameraShake: true,
    followDistance: 7,
  };

  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();
  private isDestroyed = false;
  private canvas: HTMLCanvasElement;
  private telemetryTimer = 0;
  private collisionCooldown = 0;

  // React state synchronization callback
  public onStateChange?: (state: GameState) => void;
  public onTelemetryUpdate?: (data: {
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
  }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 2. Scene & Lighting Setup
    this.scene = new THREE.Scene();
    this.lightingSystem = new LightingSystem(this.scene);

    // 3. Camera Setup
    this.cameraSystem = new CameraSystem(width / height);

    // 4. Track Setup
    this.track = TrackBuilder.buildTrack();
    this.scene.add(this.track.group);

    // 5. Environment & Props Setup
    const env = EnvironmentBuilder.buildEnvironment();
    this.scene.add(env.group);
    this.environmentProps = env.animatedProps;

    // 6. Particle & Skid Marks Systems
    this.particles = new ParticleManager(this.scene);
    this.skidMarks = new SkidMarkManager(this.scene);

    // 7. Inputs
    this.input = new InputManager();

    // 8. Player Vehicle
    const stats = calculateCarStats(this.customization);
    const startPt = this.track.curve.getPointAt(0);
    const startTangent = this.track.curve.getTangentAt(0).normalize();
    const rotY = Math.atan2(startTangent.x, startTangent.z);

    this.playerVehicle = new Vehicle(this.customization, stats, startPt, rotY);
    this.scene.add(this.playerVehicle.group);

    // 9. Race Manager
    this.raceManager = new RaceManager(3, 'QUICK_RACE');
    this.raceManager.gameState = 'MENU';
    this.raceManager.onStateChange = (state) => {
      this.onStateChange?.(state);
    };

    // 10. Spawn AI Opponents along the starting grid
    this.spawnAI();

    // Set initial weather
    this.lightingSystem.applyWeather('SUNNY', 'DAY', this.scene);

    // Listeners
    window.addEventListener('resize', this.onWindowResize);

    // Start loop
    this.startLoop();
  }

  private spawnAI() {
    // Remove any previous AI groups
    this.aiOpponents.forEach(ai => this.scene.remove(ai.group));
    this.aiOpponents = [];

    const curve = this.track.curve;
    const trackLen = this.track.trackLength;

    AI_ROSTER.slice(0, 6).forEach((driver, idx) => {
      // Staggered starting grid positions
      const gridDist = (idx + 1) * 8.5; // distance behind or ahead
      const startU = (((1.0 - gridDist / trackLen) % 1.0) + 1.0) % 1.0;
      const offset = (idx % 2 === 0 ? -3.5 : 3.5);

      const ai = new AIOpponent(driver, startU, offset, curve);
      this.aiOpponents.push(ai);
      this.scene.add(ai.group);
    });
  }

  startRace(trackConfig: TrackConfig, gameMode: GameMode) {
    audio.init();
    audio.resume();
    audio.startMusic();

    this.raceManager.gameMode = gameMode;
    this.raceManager.totalLaps = trackConfig.totalLaps;

    // Apply track weather & time of day
    this.lightingSystem.applyWeather(trackConfig.weather, trackConfig.timeOfDay, this.scene);

    // Reset Player to starting grid
    const startPt = this.track.curve.getPointAt(0);
    startPt.x += 1.5; // Grid box position
    const startTangent = this.track.curve.getTangentAt(0).normalize();
    const rotY = Math.atan2(startTangent.x, startTangent.z);
    this.playerVehicle.reset(startPt, rotY);

    // Respawn AI
    if (gameMode !== 'TIME_TRIAL' && gameMode !== 'FREE_DRIVE') {
      this.spawnAI();
    } else {
      this.aiOpponents.forEach(ai => this.scene.remove(ai.group));
      this.aiOpponents = [];
    }

    this.raceManager.startCountdown();
    this.cameraSystem.setMode('CHASE');
    this.cameraSystem.snapToVehicle(this.playerVehicle);
    this.onStateChange?.('COUNTDOWN');
  }

  updateCustomization(customization: CarCustomization) {
    this.customization = customization;
    const stats = calculateCarStats(customization);

    // Rebuild player vehicle with new paint/tuning
    this.scene.remove(this.playerVehicle.group);
    const currPos = this.playerVehicle.physics.position.clone();
    const currQuat = this.playerVehicle.physics.quaternion.clone();

    this.playerVehicle = new Vehicle(customization, stats, currPos, 0);
    this.playerVehicle.physics.quaternion.copy(currQuat);
    this.scene.add(this.playerVehicle.group);
  }

  private onWindowResize = () => {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.cameraSystem.camera.aspect = width / height;
    this.cameraSystem.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private startLoop() {
    const loop = () => {
      if (this.isDestroyed) return;
      this.animationFrameId = requestAnimationFrame(loop);

      const delta = Math.min(0.05, this.clock.getDelta());
      const elapsed = this.clock.getElapsedTime();

      this.update(delta, elapsed);
      this.render();
    };
    loop();
  }

  private update(delta: number, elapsed: number) {
    const state = this.raceManager.gameState;

    // Update animated world props (cranes, wind turbines, billboards, traffic)
    this.environmentProps.forEach(prop => prop.update(delta, elapsed));

    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= delta;
    }

    if (state === 'PAUSED') {
      return;
    }

    if (state === 'MENU' || state === 'GARAGE') {
      // Menu showcase camera orbiting car
      this.cameraSystem.updateMenuCamera(this.playerVehicle.physics.position, elapsed);
      // Wheels slowly spinning in showroom
      return;
    }

    // 1. Read Inputs
    this.input.update();
    const inputs = state === 'COUNTDOWN' 
      ? { throttle: 0, brake: 0, steer: 0, handbrake: true, boost: false }
      : this.input.inputs;

    // 2. Update Player Vehicle
    this.playerVehicle.update(delta, inputs, this.lightingSystem.gripMultiplier);

    // Check track boundaries / barriers & road height
    this.checkTrackCollisions(delta);

    // 3. Update AI Opponents
    const allCarPositions = [this.playerVehicle.physics.position, ...this.aiOpponents.map(a => a.position)];
    this.aiOpponents.forEach(ai => {
      ai.update(delta, this.track.curve, this.track.trackLength, allCarPositions);
    });

    // 3.5 Car-to-Car collisions (Player vs AI)
    const playerP = this.playerVehicle.physics.position;
    this.aiOpponents.forEach(ai => {
      const dx = playerP.x - ai.position.x;
      const dz = playerP.z - ai.position.z;
      const dist2D = Math.hypot(dx, dz);
      if (dist2D < 2.4 && dist2D > 0.05) {
        const overlap = 2.4 - dist2D;
        const pushX = (dx / dist2D) * overlap * 0.5;
        const pushZ = (dz / dist2D) * overlap * 0.5;
        playerP.x += pushX;
        playerP.z += pushZ;
        ai.position.x -= pushX;
        ai.position.z -= pushZ;

        if (this.collisionCooldown <= 0) {
          audio.playCollision(0.4);
          this.cameraSystem.addShake(0.2);
          this.particles.emitSparks(playerP);
          this.collisionCooldown = 0.25;
        }
      }
    });

    // 4. Update Race Manager
    this.raceManager.update(delta, this.playerVehicle, this.aiOpponents, this.track);

    // 5. Update Camera
    this.cameraSystem.update(delta, this.playerVehicle, elapsed, this.settings.cameraShake);

    // 6. Particle & Skid Marks Emitters
    if (this.settings.particles) {
      // Tire Smoke on drift
      if (this.playerVehicle.physics.isDrifting) {
        const carPos = this.playerVehicle.physics.position;
        const carVel = this.playerVehicle.physics.velocity;
        this.particles.emitTireSmoke(carPos, carVel);
        this.particles.emitSparks(carPos);

        // Add skid marks
        const leftTire = carPos.clone().add(new THREE.Vector3(-0.9, 0, -1.3).applyQuaternion(this.playerVehicle.physics.quaternion));
        const rightTire = carPos.clone().add(new THREE.Vector3(0.9, 0, -1.3).applyQuaternion(this.playerVehicle.physics.quaternion));
        this.skidMarks.addSkidMarks(leftTire, rightTire);
      } else {
        this.skidMarks.stopSkid();
      }

      // Boost Exhaust Flame
      if (this.playerVehicle.physics.isBoosting) {
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.playerVehicle.physics.quaternion);
        const exhL = this.playerVehicle.model.exhaustLeft.clone().applyQuaternion(this.playerVehicle.physics.quaternion).add(this.playerVehicle.physics.position);
        const exhR = this.playerVehicle.model.exhaustRight.clone().applyQuaternion(this.playerVehicle.physics.quaternion).add(this.playerVehicle.physics.position);
        this.particles.emitExhaustFlame(exhL, forward);
        this.particles.emitExhaustFlame(exhR, forward);
        audio.setBoostActive(true);
      } else {
        audio.setBoostActive(false);
      }

      this.particles.update(delta, this.cameraSystem.camera);
      this.skidMarks.update(delta);
    }

    // 7. Lighting & Weather
    this.lightingSystem.update(delta, this.playerVehicle.physics.position, this.lightingSystem.rainParticles?.visible ?? false);

    // 8. Stream Telemetry to React HUD (throttled to 20 FPS to prevent React render thrashing)
    this.telemetryTimer += delta;
    if (this.telemetryTimer >= 0.05) {
      this.telemetryTimer = 0;
      if (this.onTelemetryUpdate && (state === 'COUNTDOWN' || state === 'RACING' || state === 'FINISHED')) {
        const currentCp = this.track.checkpoints[this.raceManager.currentCheckpointIndex];
        this.onTelemetryUpdate({
          speedKmh: this.playerVehicle.physics.speedKmh,
          rpm: Math.round(this.playerVehicle.physics.engineRpm),
          gear: this.playerVehicle.physics.gear,
          boost: Math.round(this.playerVehicle.physics.boostAmount),
          fuel: Math.round(this.playerVehicle.physics.fuelAmount),
          damage: Math.round(this.playerVehicle.physics.damage),
          lap: this.raceManager.currentLap,
          totalLaps: this.raceManager.totalLaps,
          position: this.raceManager.playerPosition,
          totalRacers: this.aiOpponents.length + 1,
          currentLapTime: this.raceManager.formatTime(this.raceManager.currentLapTime),
          bestLapTime: this.raceManager.bestLapTime ? this.raceManager.formatTime(this.raceManager.bestLapTime) : '--:--.---',
          totalRaceTime: this.raceManager.formatTime(this.raceManager.totalRaceTime),
          countdown: this.raceManager.countdownValue,
          notifications: this.raceManager.notifications,
          driftScore: this.playerVehicle.physics.driftScore,
          driftCombo: Number(this.playerVehicle.physics.driftCombo.toFixed(1)),
          isDrifting: this.playerVehicle.physics.isDrifting,
          zoneName: currentCp ? currentCp.zone : 'GRAND CIRCUIT',
        });
      }
    }
  }

  private checkTrackCollisions(delta: number) {
    const playerPos = this.playerVehicle.physics.position;
    const px = playerPos.x;
    const pz = playerPos.z;

    // 1. Find nearest checkpoint to locate player on track spline
    let bestDistSq = Infinity;
    let bestCpIdx = 0;
    const cps = this.track.checkpoints;
    for (let i = 0; i < cps.length; i++) {
      const dx = px - cps[i].position.x;
      const dz = pz - cps[i].position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        bestCpIdx = i;
      }
    }

    // 2. Fine-tune u along the spline around the nearest checkpoint
    const uApprox = bestCpIdx / cps.length;
    let bestPt = this.track.curve.getPointAt(uApprox);
    let min2DDist = Math.hypot(px - bestPt.x, pz - bestPt.z);
    const step = 0.002;

    for (let k = -6; k <= 6; k++) {
      const testU = (((uApprox + k * step) % 1.0) + 1.0) % 1.0;
      const pt = this.track.curve.getPointAt(testU);
      const d2 = Math.hypot(px - pt.x, pz - pt.z);
      if (d2 < min2DDist) {
        min2DDist = d2;
        bestPt = pt;
      }
    }

    // 3. Keep player car smoothly following road elevation
    playerPos.y = THREE.MathUtils.lerp(playerPos.y, bestPt.y + 0.02, Math.min(1.0, delta * 25));

    // 4. Guardrail barrier collision (road is ~17m wide, halfWidth = 8.5m)
    const trackHalfWidth = 8.2;
    if (min2DDist > trackHalfWidth && min2DDist < 28) {
      // 2D horizontal vector pointing from car toward track center
      const nx = bestPt.x - px;
      const nz = bestPt.z - pz;
      const len = Math.hypot(nx, nz) || 1;
      const dirX = nx / len;
      const dirZ = nz / len;

      // Clamp car strictly within the barrier boundary so it cannot clip through
      playerPos.x = bestPt.x - dirX * trackHalfWidth;
      playerPos.z = bestPt.z - dirZ * trackHalfWidth;

      // Wall-slide physics: eliminate velocity component into the wall and apply barrier friction
      const vel = this.playerVehicle.physics.velocity;
      const normalDotVel = vel.x * dirX + vel.z * dirZ;

      if (normalDotVel < 0) {
        // Cancel the velocity directed outside into the barrier
        vel.x -= normalDotVel * dirX;
        vel.z -= normalDotVel * dirZ;
        vel.multiplyScalar(0.9);
      }

      const speed = this.playerVehicle.physics.speedMs;
      if (this.collisionCooldown <= 0 && Math.abs(speed) > 3) {
        audio.playCollision(Math.min(1.0, Math.abs(speed) / 25));
        this.cameraSystem.addShake(0.3);
        this.particles.emitSparks(playerPos);
        const damageDelta = Math.min(10, Math.abs(speed) * 0.3);
        this.playerVehicle.physics.damage = Math.min(100, this.playerVehicle.physics.damage + damageDelta);
        this.collisionCooldown = 0.35;
      }
    }
  }

  private render() {
    this.renderer.render(this.scene, this.cameraSystem.camera);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.input.destroy();
    audio.stopMusic();
    this.renderer.dispose();
  }
}
