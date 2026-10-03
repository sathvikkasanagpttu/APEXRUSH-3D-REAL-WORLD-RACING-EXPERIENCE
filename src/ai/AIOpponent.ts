import * as THREE from 'three';
import { BuiltCarModel, CarModelBuilder } from '../vehicles/CarModelBuilder';
import { AIPersonality, CarCustomization } from '../data/gameTypes';

export interface AIDriverProfile {
  name: string;
  personality: AIPersonality;
  color: string;
  maxSpeedMs: number;
  accelFactor: number;
  brakeAggression: number;
  overtakeBias: number; // lateral offset preference
}

export const AI_ROSTER: AIDriverProfile[] = [
  { name: 'Lucas Thorne', personality: 'AGGRESSIVE', color: '#ff3300', maxSpeedMs: 76, accelFactor: 1.15, brakeAggression: 0.9, overtakeBias: 2.5 },
  { name: 'Elena Rostova', personality: 'PRO', color: '#00d4ff', maxSpeedMs: 78, accelFactor: 1.2, brakeAggression: 1.05, overtakeBias: -2.0 },
  { name: 'Kenji Sato', personality: 'BALANCED', color: '#ffcc00', maxSpeedMs: 73, accelFactor: 1.05, brakeAggression: 1.0, overtakeBias: 0.5 },
  { name: 'Marcus Vance', personality: 'DEFENSIVE', color: '#2ecc71', maxSpeedMs: 71, accelFactor: 1.0, brakeAggression: 1.1, overtakeBias: -1.2 },
  { name: 'Sophia Sterling', personality: 'PRO', color: '#9b59b6', maxSpeedMs: 77, accelFactor: 1.18, brakeAggression: 1.0, overtakeBias: 1.8 },
  { name: 'Dante Ricci', personality: 'AGGRESSIVE', color: '#e67e22', maxSpeedMs: 74, accelFactor: 1.1, brakeAggression: 0.95, overtakeBias: -2.8 },
  { name: 'Aria Chen', personality: 'BEGINNER', color: '#95a5a6', maxSpeedMs: 66, accelFactor: 0.9, brakeAggression: 1.2, overtakeBias: 0.0 },
];

export class AIOpponent {
  public profile: AIDriverProfile;
  public model: BuiltCarModel;
  public group: THREE.Group;

  // Race Progress
  public progressU = 0; // 0..1 along spline
  public lap = 1;
  public currentCheckpoint = 0;
  public totalDistance = 0;
  public currentSpeedMs = 0;
  public speedKmh = 0;

  // Lateral lane offset from track center (-5 to +5 meters)
  public lateralOffset = 0;
  public targetOffset = 0;
  private offsetChangeTimer = 0;

  // Transform
  public position = new THREE.Vector3();
  public forward = new THREE.Vector3(0, 0, 1);
  public wheelSpin = 0;

  constructor(profile: AIDriverProfile, startingU: number, startingOffset: number, curve: THREE.CatmullRomCurve3) {
    this.profile = profile;
    this.progressU = Math.max(0, Math.min(1, startingU));
    this.lateralOffset = startingOffset;
    this.targetOffset = startingOffset;

    const customization: CarCustomization = {
      bodyColor: profile.color,
      rimColor: '#222222',
      interiorColor: '#111111',
      neonColor: 'transparent',
      spoilerStyle: profile.personality === 'PRO' || profile.personality === 'AGGRESSIVE' ? 2 : 1,
      paintFinish: 'metallic',
      brakeColor: '#e50000',
      engineLevel: 1,
      tireLevel: 1,
      brakeLevel: 1,
    };

    this.model = CarModelBuilder.buildSportsCar(customization, false);
    this.group = this.model.root;

    this.updatePositionOnSpline(curve, 0);
  }

  update(delta: number, curve: THREE.CatmullRomCurve3, trackLength: number, otherCarsPositions: THREE.Vector3[]) {
    const dt = Math.max(0.001, Math.min(delta, 0.05));

    // 1. Evaluate curvature ahead (lookahead 35m)
    const lookaheadU = (this.progressU + 35 / Math.max(10, trackLength)) % 1;
    const currentTangent = curve.getTangentAt(this.progressU);
    const aheadTangent = curve.getTangentAt(lookaheadU);
    const angleDiff = currentTangent.angleTo(aheadTangent);

    // Target speed calculation based on curvature and driver skill
    let targetSpeed = this.profile.maxSpeedMs;
    if (angleDiff > 0.15) {
      // Corner ahead! Brake according to curve sharpness
      const cornerFactor = THREE.MathUtils.clamp(1.0 - (angleDiff / Math.PI) * 2.8, 0.45, 1.0);
      targetSpeed = this.profile.maxSpeedMs * cornerFactor * this.profile.brakeAggression;
    }

    // Accelerate or brake toward target speed
    if (this.currentSpeedMs < targetSpeed) {
      const accel = 11 * this.profile.accelFactor;
      this.currentSpeedMs = Math.min(targetSpeed, this.currentSpeedMs + accel * dt);
      this.model.brakeLightMaterial.emissiveIntensity = 0.5;
    } else {
      const brake = 16 * this.profile.brakeAggression;
      this.currentSpeedMs = Math.max(targetSpeed, this.currentSpeedMs - brake * dt);
      this.model.brakeLightMaterial.emissiveIntensity = 3.5;
    }

    this.speedKmh = Math.round(this.currentSpeedMs * 3.6);

    // 2. Collision avoidance & Overtaking AI logic
    this.offsetChangeTimer -= dt;
    if (this.offsetChangeTimer <= 0) {
      this.offsetChangeTimer = 2.0 + Math.random() * 2.0;

      // Check if another car is directly ahead within 18m
      let blockedAhead = false;
      const myPos = this.position;

      for (const otherPos of otherCarsPositions) {
        if (!otherPos || otherPos === myPos) continue;
        const dist = myPos.distanceTo(otherPos);
        if (dist < 18 && dist > 0.2) {
          const toOther = otherPos.clone().sub(myPos).normalize();
          if (toOther.dot(this.forward) > 0.5) {
            blockedAhead = true;
            break;
          }
        }
      }

      if (blockedAhead) {
        // Switch overtaking lane!
        this.targetOffset = this.lateralOffset > 0 ? -3.5 : 3.5;
      } else {
        // Return to optimal racing line or preferred lane
        this.targetOffset = this.profile.overtakeBias;
      }
    }

    // Clamp lateral target to safe road width (-5.5 to +5.5 meters)
    this.targetOffset = THREE.MathUtils.clamp(this.targetOffset, -5.5, 5.5);
    this.lateralOffset = THREE.MathUtils.lerp(this.lateralOffset, this.targetOffset, dt * 2.0);
    this.lateralOffset = THREE.MathUtils.clamp(this.lateralOffset, -5.8, 5.8);

    // 3. Advance spline progress
    const moveDist = this.currentSpeedMs * dt;
    this.totalDistance += moveDist;
    const deltaU = moveDist / Math.max(10, trackLength);
    const oldU = this.progressU;
    this.progressU = (this.progressU + deltaU) % 1;

    // Check lap completion
    if (oldU > 0.85 && this.progressU < 0.15) {
      this.lap++;
    }

    // 4. Update 3D position and orientation
    this.updatePositionOnSpline(curve, dt);

    // 5. Animate Wheels
    const rollDelta = (this.currentSpeedMs * dt) / 0.38;
    this.wheelSpin += rollDelta;
    const lHub = this.model.frontLeftWheel.children[0];
    const rHub = this.model.frontRightWheel.children[0];
    const rlHub = this.model.rearLeftWheel.children[0];
    const rrHub = this.model.rearRightWheel.children[0];

    if (lHub) lHub.rotation.x = this.wheelSpin;
    if (rHub) rHub.rotation.x = this.wheelSpin;
    if (rlHub) rlHub.rotation.x = this.wheelSpin;
    if (rrHub) rrHub.rotation.x = this.wheelSpin;
  }

  private updatePositionOnSpline(curve: THREE.CatmullRomCurve3, delta: number) {
    const centerPoint = curve.getPointAt(this.progressU);
    const tangent = curve.getTangentAt(this.progressU).normalize();
    const upVector = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, upVector).normalize();

    // Offset position across track width
    const targetPos = centerPoint.clone().addScaledVector(normal, this.lateralOffset);
    targetPos.y += 0.05; // slight clearance above asphalt

    this.position.copy(targetPos);
    this.group.position.copy(targetPos);
    this.forward.copy(tangent);

    // Orient car stably along track tangent without antiparallel gimbal lock
    const targetRotY = Math.atan2(tangent.x, tangent.z);
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotY);
    if (delta > 0) {
      this.group.quaternion.slerp(targetQuat, Math.min(1, delta * 15));
    } else {
      this.group.quaternion.copy(targetQuat);
    }
  }

  reset(startingU: number, startingOffset: number, curve: THREE.CatmullRomCurve3) {
    this.progressU = Math.max(0, Math.min(1, startingU));
    this.lateralOffset = startingOffset;
    this.targetOffset = startingOffset;
    this.lap = 1;
    this.currentCheckpoint = 0;
    this.totalDistance = 0;
    this.currentSpeedMs = 0;
    this.speedKmh = 0;
    this.offsetChangeTimer = 0;
    this.wheelSpin = 0;
    this.updatePositionOnSpline(curve, 0);
  }

  dispose() {
    this.model.materials.forEach(mat => mat.dispose());
  }
}
