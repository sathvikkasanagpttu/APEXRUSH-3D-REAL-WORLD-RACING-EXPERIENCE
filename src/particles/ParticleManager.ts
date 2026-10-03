import * as THREE from 'three';

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
  growth: number;
  color: THREE.Color;
  alpha: number;
}

export class ParticleManager {
  private particles: Particle[] = [];
  private maxParticles = 600;
  private instancedMesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private colorArray: Float32Array;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(0.5, 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.colorArray = new Float32Array(this.maxParticles * 3);
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(this.colorArray, 3);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 1,
        growth: 1,
        color: new THREE.Color(),
        alpha: 1,
      });
      // Hide initially
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(this.instancedMesh);
  }

  emit(
    origin: THREE.Vector3,
    velocity: THREE.Vector3,
    color: THREE.Color,
    scale = 0.5,
    growth = 1.5,
    maxLife = 0.6
  ) {
    const p = this.particles.find(part => !part.active);
    if (!p) return;

    p.active = true;
    p.position.copy(origin);
    p.velocity.copy(velocity);
    p.color.copy(color);
    p.scale = scale;
    p.growth = growth;
    p.life = 0;
    p.maxLife = maxLife;
    p.alpha = 1.0;
  }

  emitTireSmoke(pos: THREE.Vector3, carVel: THREE.Vector3) {
    const vel = carVel.clone().multiplyScalar(0.2).add(
      new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.5)
    );
    this.emit(pos, vel, new THREE.Color(0.85, 0.85, 0.88), 0.4, 3.0, 0.7);
  }

  emitExhaustFlame(pos: THREE.Vector3, carDir: THREE.Vector3) {
    const flameColors = [new THREE.Color(0x00d4ff), new THREE.Color(0xffaa00), new THREE.Color(0xff4400)];
    const col = flameColors[Math.floor(Math.random() * flameColors.length)];
    const vel = carDir.clone().multiplyScalar(-6 - Math.random() * 4).add(
      new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5)
    );
    this.emit(pos, vel, col, 0.25, 1.2, 0.25);
  }

  emitSparks(pos: THREE.Vector3) {
    for (let i = 0; i < 4; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 8
      );
      this.emit(pos, vel, new THREE.Color(1.0, 0.8, 0.2), 0.15, 0.5, 0.35);
    }
  }

  update(delta: number, camera: THREE.Camera) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, delta);
      p.scale += p.growth * delta;
      const progress = p.life / p.maxLife;
      p.alpha = 1 - progress;

      // Face camera (billboard)
      this.dummy.position.copy(p.position);
      this.dummy.scale.setScalar(p.scale);
      this.dummy.quaternion.copy(camera.quaternion);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.instancedMesh.setColorAt(i, p.color);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
}
