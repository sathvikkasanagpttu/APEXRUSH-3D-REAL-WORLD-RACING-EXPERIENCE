import * as THREE from 'three';
import { CameraMode } from '../data/gameTypes';
import { Vehicle } from '../vehicles/Vehicle';

export class CameraSystem {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'CHASE';

  private currentTarget = new THREE.Vector3();
  private currentCamPos = new THREE.Vector3();
  private baseFov = 65;
  private shakeIntensity = 0;

  constructor(aspect: number) {
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 16 / 9;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, safeAspect, 0.1, 1000);
    this.currentCamPos.set(0, 5, -10);
    this.camera.position.copy(this.currentCamPos);
  }

  setMode(mode: CameraMode) {
    this.mode = mode;
  }

  cycleMode() {
    const modes: CameraMode[] = ['CHASE', 'HOOD', 'COCKPIT', 'CINEMATIC'];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
  }

  addShake(amount: number) {
    this.shakeIntensity = Math.min(1.0, this.shakeIntensity + Math.max(0, amount));
  }

  updateAspect(aspect: number) {
    if (Number.isFinite(aspect) && aspect > 0) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  update(delta: number, playerVehicle: Vehicle, elapsed: number, enableShake = true) {
    const dt = Math.max(0.001, Math.min(delta, 0.05));
    const carPos = playerVehicle.physics.position;
    const carQuat = playerVehicle.physics.quaternion;
    const carSpeedKmh = Math.max(0, playerVehicle.physics.speedKmh);
    const isBoosting = playerVehicle.physics.isBoosting;

    // Safety checks against NaN in car transforms
    if (!Number.isFinite(carPos.x) || !Number.isFinite(carPos.y) || !Number.isFinite(carPos.z)) {
      return;
    }

    // Speed-based dynamic FOV
    const speedRatio = Math.min(1.0, carSpeedKmh / 260);
    const targetFov = this.baseFov + speedRatio * 12 + (isBoosting ? 8 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 5);
    this.camera.updateProjectionMatrix();

    // Camera vectors from car orientation
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(carQuat).normalize();

    let desiredPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();
    let followLerp = 8.0;

    switch (this.mode) {
      case 'CHASE': {
        // Behind car with dynamic cornering lead
        const chaseDist = 6.8 + speedRatio * 1.5;
        const chaseHeight = 2.6 + speedRatio * 0.4;
        const cornerOffset = -playerVehicle.physics.angularVelocity * 0.8;

        desiredPos = carPos.clone()
          .addScaledVector(forward, -chaseDist)
          .addScaledVector(up, chaseHeight)
          .addScaledVector(right, cornerOffset);

        // Lookahead point in front of car
        lookTarget = carPos.clone().addScaledVector(forward, 12).addScaledVector(up, 1.2);
        followLerp = 9.0;
        break;
      }

      case 'HOOD': {
        // Mounted on hood
        desiredPos = carPos.clone()
          .addScaledVector(forward, 1.2)
          .addScaledVector(up, 1.15);

        lookTarget = carPos.clone().addScaledVector(forward, 25).addScaledVector(up, 0.8);
        followLerp = 25.0; // tighter follow
        break;
      }

      case 'COCKPIT': {
        // Inside cabin, behind steering wheel
        desiredPos = carPos.clone()
          .addScaledVector(right, -0.35)
          .addScaledVector(up, 1.12)
          .addScaledVector(forward, -0.15);

        lookTarget = carPos.clone().addScaledVector(forward, 20).addScaledVector(up, 1.0);
        followLerp = 30.0;
        break;
      }

      case 'CINEMATIC': {
        // Dramatic dynamic orbiting angle
        const orbitRadius = 14;
        const orbitAngle = elapsed * 0.4;
        desiredPos = carPos.clone().add(
          new THREE.Vector3(
            Math.sin(orbitAngle) * orbitRadius,
            4 + Math.cos(orbitAngle * 0.5) * 2,
            Math.cos(orbitAngle) * orbitRadius
          )
        );

        lookTarget = carPos.clone().addScaledVector(up, 1.0);
        followLerp = 4.0;
        break;
      }
    }

    // Camera shake calculation (engine rumble + drift + collisions)
    const shakeOffset = new THREE.Vector3();
    if (enableShake && (this.shakeIntensity > 0.01 || carSpeedKmh > 80)) {
      const shakeMag = Math.min(0.35, (this.shakeIntensity * 0.35) + (carSpeedKmh / 260) * 0.035);
      shakeOffset.set(
        (Math.sin(elapsed * 45) + Math.cos(elapsed * 32)) * shakeMag,
        (Math.sin(elapsed * 38) + Math.cos(elapsed * 50)) * shakeMag * 0.6,
        0
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.5);
    }

    // Smoothly interpolate position and lookAt
    if (Number.isFinite(desiredPos.x) && Number.isFinite(lookTarget.x)) {
      this.currentCamPos.lerp(desiredPos, Math.min(1.0, dt * followLerp));
      this.currentTarget.lerp(lookTarget, Math.min(1.0, dt * followLerp));
      this.camera.position.copy(this.currentCamPos).add(shakeOffset);
      this.camera.lookAt(this.currentTarget);
    }
  }

  updateMenuCamera(carPos: THREE.Vector3, elapsed: number) {
    if (!Number.isFinite(carPos.x) || !Number.isFinite(carPos.y) || !Number.isFinite(carPos.z)) {
      return;
    }

    // Elegant rotating showcase camera for 3D Main Menu & Garage
    const radius = 7.5;
    const height = 2.2 + Math.sin(elapsed * 0.5) * 0.5;
    const angle = elapsed * 0.35;

    this.camera.position.set(
      carPos.x + Math.sin(angle) * radius,
      carPos.y + height,
      carPos.z + Math.cos(angle) * radius
    );
    this.camera.fov = 48;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(carPos.x, carPos.y + 0.8, carPos.z);
  }

  snapToVehicle(playerVehicle: Vehicle) {
    const carPos = playerVehicle.physics.position;
    const carQuat = playerVehicle.physics.quaternion;
    if (!Number.isFinite(carPos.x)) return;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    const chaseDist = 6.8;
    const chaseHeight = 2.6;

    this.currentCamPos = carPos.clone()
      .addScaledVector(forward, -chaseDist)
      .addScaledVector(up, chaseHeight);

    this.currentTarget = carPos.clone()
      .addScaledVector(forward, 12)
      .addScaledVector(up, 1.2);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentTarget);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }
}
