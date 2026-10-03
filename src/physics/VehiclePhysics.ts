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
  public angularVelocity = 0; // Yaw rate

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
  private readonly maxSpeedForwardMs: number;
  private readonly maxSpeedReverseMs = 15;
  private readonly gearRatios = [3.8, 2.6, 1.9, 1.4, 1.1, 0.88];
  private readonly gearMaxSpeeds = [16, 28, 42, 58, 72, 90]; // m/s (~60, 100, 150, 210, 260, 320 km/h)

  constructor(stats: CarStats, startPos: THREE.Vector3, startRotY = 0) {
    this.stats = stats;
    this.position.copy(startPos);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), startRotY);

    // Calculate max speed in m/s based on car stats
    // 100 speed stat ~ 320 km/h = 88.8 m/s
    this.maxSpeedForwardMs = 50 + (stats.speed / 100) * 38;
  }

  update(delta: number, inputs: VehicleInputs, gripModifier = 1.0) {
    // Forward and Right vectors from car orientation
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
    if (inputs.boost && this.boostAmount > 0 && inputs.throttle > 0.1) {
      this.isBoosting = true;
      this.boostAmount = Math.max(0, this.boostAmount - delta * 20); // 5 sec full boost
      boostAccelMultiplier = 1.6;
    } else if (!inputs.boost && this.boostAmount < 100) {
      // Regenerate boost slowly over time
      this.boostAmount = Math.min(100, this.boostAmount + delta * 6);
    }

    // Fuel consumption
    if (inputs.throttle > 0.1) {
      const burnRate = this.isBoosting ? 0.35 : 0.12;
      this.fuelAmount = Math.max(0, this.fuelAmount - delta * burnRate);
    }

    // Acceleration Force
    let targetAccel = 0;
    const accelPower = 12 + (this.stats.acceleration / 100) * 14;

    if (inputs.throttle > 0 && this.fuelAmount > 0) {
      // Forward throttle
      if (forwardSpeed < this.maxSpeedForwardMs * (this.isBoosting ? 1.18 : 1.0)) {
        targetAccel = inputs.throttle * accelPower * boostAccelMultiplier;
      }
    } else if (inputs.brake > 0) {
      if (forwardSpeed > 1.0) {
        // Braking while moving forward
        const brakePower = 20 + (this.stats.braking / 100) * 16;
        targetAccel = -inputs.brake * brakePower;
      } else {
        // Reverse
        if (forwardSpeed > -this.maxSpeedReverseMs) {
          targetAccel = -inputs.brake * accelPower * 0.55;
        }
      }
    }

    // Rolling friction & aerodynamic drag
    const airDrag = 0.0018 * forwardSpeed * Math.abs(forwardSpeed);
    const rollingResistance = 1.2 * Math.sign(forwardSpeed);
    const netLongitudinalForce = targetAccel - airDrag - (Math.abs(forwardSpeed) > 0.1 ? rollingResistance : 0);

    // Apply longitudinal acceleration
    const newForwardSpeed = forwardSpeed + netLongitudinalForce * delta;

    // Lateral grip and Drifting mechanics
    let tireGrip = (0.85 + (this.stats.grip / 100) * 0.35) * gripModifier;

    if (inputs.handbrake) {
      // Handbrake cuts rear tire grip by 65%
      tireGrip *= 0.35;
    }

    // Slip Angle calculation
    const totalSpeed = Math.hypot(forwardSpeed, lateralSpeed);
    this.driftAngle = totalSpeed > 3 ? Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed)) : 0;

    const driftThreshold = 0.22; // ~13 degrees
    if (this.driftAngle > driftThreshold && totalSpeed > 8) {
      this.isDrifting = true;
      const points = Math.round(totalSpeed * this.driftAngle * 40 * delta);
      this.driftScore += points;
      this.driftCombo = Math.min(5.0, this.driftCombo + delta * 0.4);
    } else {
      this.isDrifting = false;
      if (this.driftCombo > 1.0) {
        this.driftCombo = Math.max(1.0, this.driftCombo - delta * 1.5);
      }
    }

    // Lateral friction opposes sideways velocity
    const lateralFrictionForce = -lateralSpeed * tireGrip * 14;
    const newLateralSpeed = lateralSpeed + lateralFrictionForce * delta;

    // Speed-dependent steering
    // At high speeds, reduce maximum steering angle to maintain stability
    const speedRatio = Math.min(1.0, Math.abs(forwardSpeed) / 60);
    const maxSteerAngle = THREE.MathUtils.lerp(0.65, 0.18, speedRatio);
    const steerResponse = 2.2 + (this.stats.handling / 100) * 1.6;

    let targetYawRate = 0;
    if (Math.abs(forwardSpeed) > 0.5) {
      const directionSign = forwardSpeed >= 0 ? 1 : -1;
      const driftBoost = inputs.handbrake ? 1.3 : (this.isDrifting ? 1.15 : 1.0);
      targetYawRate = inputs.steer * maxSteerAngle * steerResponse * directionSign * driftBoost;
    }

    this.angularVelocity = THREE.MathUtils.lerp(this.angularVelocity, targetYawRate, delta * 10);

    // Rotate vehicle quaternion around Y axis
    const deltaRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.angularVelocity * delta
    );
    this.quaternion.multiply(deltaRotation);

    // Reconstruct world velocity
    const newForwardVec = new THREE.Vector3(0, 0, 1).applyQuaternion(this.quaternion);
    const newRightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
    this.velocity.copy(newForwardVec.multiplyScalar(newForwardSpeed)).add(newRightVec.multiplyScalar(newLateralSpeed));

    // Update position
    this.position.addScaledVector(this.velocity, delta);

    // Update Gearbox & Engine RPM
    this.updateGearbox(forwardSpeed);

    // Calculate Weight Transfer (pitch & roll for car visual suspension)
    const targetPitch = THREE.MathUtils.clamp(-netLongitudinalForce * 0.003, -0.06, 0.06);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, delta * 12);

    const targetRoll = THREE.MathUtils.clamp(this.angularVelocity * forwardSpeed * 0.003, -0.08, 0.08);
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, delta * 12);
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
    const gearProgress = Math.max(0, Math.min(1, (absSpeed - prevGearMax * 0.7) / (currentGearMax - prevGearMax * 0.7)));

    this.engineRpm = 1200 + gearProgress * 6800;
  }

  applyCollision(normal: THREE.Vector3, impactSpeed: number) {
    // Bounce / reflect velocity away from barrier
    this.velocity.reflect(normal).multiplyScalar(0.45);
    // Push slightly outward to avoid getting stuck
    this.position.addScaledVector(normal, 0.4);

    // Damage accumulation
    const damageAmount = Math.min(25, (impactSpeed / 30) * 15);
    this.damage = Math.min(100, this.damage + damageAmount);
  }

  reset(pos: THREE.Vector3, rotY: number) {
    this.position.copy(pos);
    this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.speedKmh = 0;
    this.speedMs = 0;
    this.engineRpm = 900;
    this.gear = 1;
    this.isDrifting = false;
  }
}
