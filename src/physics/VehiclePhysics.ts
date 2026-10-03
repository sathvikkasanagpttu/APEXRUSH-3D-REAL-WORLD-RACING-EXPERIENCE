import * as THREE from 'three';
import { CarStats } from '../data/gameTypes';

export interface VehicleInputs {
  throttle: number; // 0..1
  brake: number;    // 0..1
  steer: number;    // -1..1
  handbrake: boolean;
  boost: boolean;
}

export class VehiclePhysics {
  public position = new THREE.Vector3();
  public quaternion = new THREE.Quaternion();
  public velocity = new THREE.Vector3();
  public angularVelocity = 0; // Yaw rate (rad/s)

  // Car stats
  public stats: CarStats;

  // State variables
  public speedKmh = 0;
  public speedMs = 0;
  public engineRpm = 900;
  public gear = 1; // 0 = R, 1..6
  public isDrifting = false;
  public driftScore = 0;
  public driftCombo = 1.0;
  public driftAngle = 0;

  // Suspension & Weight transfer for visual body roll/pitch
  public pitch = 0; // Front/rear dive & squat
  public roll = 0;  // Cornering lean
  public suspensionHeight = 0;

  // Boost & Resources
  public boostAmount = 100; // 0..100%
  public isBoosting = false;
  public fuelAmount = 100;  // 0..100%
  public damage = 0;        // 0..100%

  // Constants & Tuning
  private maxSpeedForwardMs: number;
  private readonly maxSpeedReverseMs = 15;
  private readonly gearMaxSpeeds = [16, 28, 42, 58, 72, 90]; // m/s (~60, 100, 150, 210, 260, 320 km/h)

  constructor(stats: CarStats, startPos: THREE.Vector3, startRotY = 0) {
    this.stats = stats;
    const safeX = Number.isFinite(startPos.x) ? startPos.x : 0;
    const safeY = Number.isFinite(startPos.y) ? startPos.y : 0.5;
    const safeZ = Number.isFinite(startPos.z) ? startPos.z : 0;
    const safeRot = Number.isFinite(startRotY) ? startRotY : 0;

    this.position.set(safeX, safeY, safeZ);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), safeRot);
    this.maxSpeedForwardMs = 50 + (stats.speed / 100) * 38;
  }

  public updateStats(stats: CarStats) {
    this.stats = stats;
    this.maxSpeedForwardMs = 50 + (stats.speed / 100) * 38;
  }

  update(delta: number, rawInputs: VehicleInputs, gripModifier = 1.0) {
    // Clamp delta time to avoid large physics steps causing explosion or tunneling
    const dt = Math.max(0.001, Math.min(delta, 0.05));

    // Sanitize inputs
    const throttle = Math.max(0, Math.min(1, Number.isFinite(rawInputs.throttle) ? rawInputs.throttle : 0));
    const brake = Math.max(0, Math.min(1, Number.isFinite(rawInputs.brake) ? rawInputs.brake : 0));
    const steer = Math.max(-1, Math.min(1, Number.isFinite(rawInputs.steer) ? rawInputs.steer : 0));
    const handbrake = !!rawInputs.handbrake;
    const boost = !!rawInputs.boost;

    // Safety checks against NaN / Infinity
    if (!Number.isFinite(this.position.x) || !Number.isFinite(this.position.y) || !Number.isFinite(this.position.z)) {
      this.position.set(0, 0.5, 0);
    }
    if (!Number.isFinite(this.velocity.x) || !Number.isFinite(this.velocity.y) || !Number.isFinite(this.velocity.z)) {
      this.velocity.set(0, 0, 0);
    }
    if (!Number.isFinite(this.angularVelocity)) {
      this.angularVelocity = 0;
    }

    // Forward and Right unit vectors from car orientation
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.quaternion).normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion).normalize();

    // Decompose velocity into longitudinal (forward) and lateral (sideways)
    const forwardSpeed = this.velocity.dot(forward);
    const lateralSpeed = this.velocity.dot(right);

    this.speedMs = forwardSpeed;
    this.speedKmh = Math.abs(Math.round(forwardSpeed * 3.6));

    // Handle Boost
    this.isBoosting = false;
    let boostAccelMultiplier = 1.0;
    if (boost && this.boostAmount > 0 && throttle > 0.1) {
      this.isBoosting = true;
      this.boostAmount = Math.max(0, this.boostAmount - dt * 20); // 5 sec full boost
      boostAccelMultiplier = 1.6;
    } else if (!boost && this.boostAmount < 100) {
      // Regenerate boost slowly over time
      this.boostAmount = Math.min(100, this.boostAmount + dt * 6);
    }

    // Fuel consumption
    if (throttle > 0.1) {
      const burnRate = this.isBoosting ? 0.35 : 0.12;
      this.fuelAmount = Math.max(0, this.fuelAmount - dt * burnRate);
    }

    // Acceleration Force
    let targetAccel = 0;
    const accelPower = 12 + (this.stats.acceleration / 100) * 14;

    if (throttle > 0 && this.fuelAmount > 0) {
      // Forward throttle
      if (forwardSpeed < this.maxSpeedForwardMs * (this.isBoosting ? 1.18 : 1.0)) {
        targetAccel = throttle * accelPower * boostAccelMultiplier;
      }
    } else if (brake > 0) {
      if (forwardSpeed > 1.0) {
        // Braking while moving forward
        const brakePower = 20 + (this.stats.braking / 100) * 16;
        targetAccel = -brake * brakePower;
      } else {
        // Reverse
        if (forwardSpeed > -this.maxSpeedReverseMs) {
          targetAccel = -brake * accelPower * 0.55;
        }
      }
    }

    // Rolling friction & aerodynamic drag
    const airDrag = 0.0018 * forwardSpeed * Math.abs(forwardSpeed);
    const rollingResistance = 1.2 * Math.sign(forwardSpeed);
    const netLongitudinalForce = targetAccel - airDrag - (Math.abs(forwardSpeed) > 0.1 ? rollingResistance : 0);

    // Apply longitudinal acceleration with strict limits
    let newForwardSpeed = forwardSpeed + netLongitudinalForce * dt;
    newForwardSpeed = Math.max(-this.maxSpeedReverseMs, Math.min(this.maxSpeedForwardMs * 1.3, newForwardSpeed));

    // Lateral grip and Drifting mechanics
    let tireGrip = (0.85 + (this.stats.grip / 100) * 0.35) * gripModifier;

    if (handbrake) {
      // Handbrake cuts rear tire grip by 65%
      tireGrip *= 0.35;
    }

    // Slip Angle calculation
    const totalSpeed = Math.hypot(forwardSpeed, lateralSpeed);
    this.driftAngle = totalSpeed > 3 ? Math.atan2(Math.abs(lateralSpeed), Math.max(0.1, Math.abs(forwardSpeed))) : 0;

    const driftThreshold = 0.22; // ~13 degrees
    if (this.driftAngle > driftThreshold && totalSpeed > 8) {
      this.isDrifting = true;
      const points = Math.round(totalSpeed * this.driftAngle * 40 * dt);
      this.driftScore += points;
      this.driftCombo = Math.min(5.0, this.driftCombo + dt * 0.4);
    } else {
      this.isDrifting = false;
      if (this.driftCombo > 1.0) {
        this.driftCombo = Math.max(1.0, this.driftCombo - dt * 1.5);
      }
    }

    // Lateral friction opposes sideways velocity
    const lateralFrictionForce = -lateralSpeed * tireGrip * 14;
    const newLateralSpeed = lateralSpeed + lateralFrictionForce * dt;

    // Speed-dependent steering
    // At high speeds, reduce maximum steering angle to maintain stability
    const speedRatio = Math.min(1.0, Math.abs(forwardSpeed) / 60);
    const maxSteerAngle = THREE.MathUtils.lerp(0.65, 0.18, speedRatio);
    const steerResponse = 2.2 + (this.stats.handling / 100) * 1.6;

    let targetYawRate = 0;
    if (Math.abs(forwardSpeed) > 0.5) {
      const directionSign = forwardSpeed >= 0 ? 1 : -1;
      const driftBoost = handbrake ? 1.3 : (this.isDrifting ? 1.15 : 1.0);
      targetYawRate = steer * maxSteerAngle * steerResponse * directionSign * driftBoost;
    }

    // Clamp yaw rate to prevent spinning into infinity
    targetYawRate = Math.max(-3.5, Math.min(3.5, targetYawRate));
    this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, targetYawRate, dt * 10);
    this.angularVelocity = Math.max(-4.0, Math.min(4.0, this.angularVelocity));

    // Rotate vehicle quaternion around Y axis
    const deltaRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.angularVelocity * dt
    );
    this.quaternion.multiply(deltaRotation);
    this.quaternion.normalize();

    // Reconstruct world velocity
    const newForwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.quaternion);
    const newRightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
    this.velocity.copy(newForwardVec.multiplyScalar(newForwardSpeed)).add(newRightVec.multiplyScalar(newLateralSpeed));

    // Update position
    this.position.addScaledVector(this.velocity, dt);

    // Update Gearbox & Engine RPM
    this.updateGearbox(forwardSpeed);

    // Calculate Weight Transfer (pitch & roll for car visual suspension)
    const targetPitch = THREE.MathUtils.clamp(-netLongitudinalForce * 0.003, -0.06, 0.06);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, dt * 12);

    const targetRoll = THREE.MathUtils.clamp(this.angularVelocity * forwardSpeed * 0.003, -0.08, 0.08);
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, dt * 12);
  }

  private updateGearbox(speedMs: number) {
    if (speedMs < -0.5) {
      this.gear = 0; // Reverse
      this.engineRpm = Math.min(6500, 1000 + (Math.abs(speedMs) / this.maxSpeedReverseMs) * 5500);
      return;
    }

    const absSpeed = Math.max(0, speedMs);

    // Auto-select gear
    let selectedGear = 1;
    for (let g = 0; g < this.gearMaxSpeeds.length; g++) {
      if (absSpeed > this.gearMaxSpeeds[g] * 0.85 && g < this.gearMaxSpeeds.length - 1) {
        selectedGear = g + 2;
      }
    }
    this.gear = selectedGear;

    // RPM based on current gear speed range
    const prevGearMax = selectedGear === 1 ? 0 : this.gearMaxSpeeds[selectedGear - 2];
    const currentGearMax = this.gearMaxSpeeds[selectedGear - 1];
    const gearProgress = Math.max(0, Math.min(1, (absSpeed - prevGearMax * 0.7) / Math.max(1, currentGearMax - prevGearMax * 0.7)));

    this.engineRpm = 1200 + gearProgress * 6800;
  }

  applyCollision(normal: THREE.Vector3, impactSpeed: number) {
    if (!normal || normal.lengthSq() < 0.0001 || !Number.isFinite(normal.x)) return;
    const safeNormal = normal.clone().normalize();

    // Bounce / reflect velocity away from barrier
    this.velocity.reflect(safeNormal).multiplyScalar(0.45);
    // Push slightly outward to avoid getting stuck
    this.position.addScaledVector(safeNormal, 0.4);

    // Damage accumulation
    const damageAmount = Math.min(25, (Math.abs(impactSpeed) / 30) * 15);
    this.damage = Math.min(100, this.damage + damageAmount);
  }

  reset(pos: THREE.Vector3, rotY: number) {
    const safeX = Number.isFinite(pos.x) ? pos.x : 0;
    const safeY = Number.isFinite(pos.y) ? pos.y : 0.5;
    const safeZ = Number.isFinite(pos.z) ? pos.z : 0;
    const safeRot = Number.isFinite(rotY) ? rotY : 0;

    this.position.set(safeX, safeY, safeZ);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), safeRot);
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.speedKmh = 0;
    this.speedMs = 0;
    this.engineRpm = 900;
    this.gear = 1;
    this.isDrifting = false;
    this.driftScore = 0;
    this.driftCombo = 1.0;
    this.driftAngle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.isBoosting = false;
    this.boostAmount = 100;
    this.fuelAmount = 100;
    this.damage = 0;
  }
}
