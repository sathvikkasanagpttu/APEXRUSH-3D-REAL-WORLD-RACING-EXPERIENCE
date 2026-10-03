import * as THREE from 'three';

export type GameState = 
  | 'LOADING' 
  | 'MENU' 
  | 'GARAGE' 
  | 'TRACK_SELECT' 
  | 'CHAMPIONSHIP' 
  | 'HOW_TO_PLAY' 
  | 'COUNTDOWN' 
  | 'RACING' 
  | 'PAUSED' 
  | 'FINISHED';

export type GameMode = 
  | 'QUICK_RACE' 
  | 'TIME_TRIAL' 
  | 'CHAMPIONSHIP' 
  | 'FREE_DRIVE' 
  | 'DRIFT_MODE';

export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'NIGHT';
export type TimeOfDay = 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
export type CameraMode = 'CHASE' | 'HOOD' | 'COCKPIT' | 'CINEMATIC';

export type AIPersonality = 'AGGRESSIVE' | 'BALANCED' | 'DEFENSIVE' | 'BEGINNER' | 'PRO';

export interface CarCustomization {
  bodyColor: string;
  rimColor: string;
  interiorColor: string;
  neonColor: string;
  spoilerStyle: number; // 0: none, 1: sport, 2: gt wing
  paintFinish: 'gloss' | 'matte' | 'metallic';
  brakeColor: string;
  engineLevel: number;
  tireLevel: number;
  brakeLevel: number;
}

export interface CarStats {
  speed: number;
  acceleration: number;
  handling: number;
  braking: number;
  grip: number;
}

export interface Checkpoint {
  index: number;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  width: number;
}

export interface TrackConfig {
  id: string;
  name: string;
  subtitle: string;
  totalLaps: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  description: string;
  bestLapRecord: number;
  recordHolder: string;
}

export interface RaceNotification {
  id: string;
  text: string;
  subtext?: string;
  color?: string;
  timestamp: number;
}

export interface RaceResultEntry {
  position: number;
  name: string;
  carName: string;
  time: number;
  bestLap: number;
  isPlayer: boolean;
  pointsAwarded?: number;
}

export interface SettingsConfig {
  graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  shadows: boolean;
  particles: boolean;
  postProcessing: boolean;
  masterVolume: number;
  engineVolume: number;
  effectsVolume: number;
  musicVolume: number;
  cameraFov: number;
  cameraShake: boolean;
  followDistance: number;
}
