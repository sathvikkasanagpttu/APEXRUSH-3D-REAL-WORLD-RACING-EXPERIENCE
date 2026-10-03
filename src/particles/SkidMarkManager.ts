import * as THREE from 'three';

interface SkidSegment {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  positionAttr: THREE.BufferAttribute;
  life: number;
  active: boolean;
}

export class SkidMarkManager {
  private pool: SkidSegment[] = [];
  private poolIndex = 0;
  private readonly maxSegments = 120;
  private scene: THREE.Scene;
  private lastLeftPos = new THREE.Vector3();
  private lastRightPos = new THREE.Vector3();
  private hasLast = false;
  private skidMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.skidMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Pre-allocate all geometry and mesh instances once to avoid memory allocation in loop
    for (let i = 0; i < this.maxSegments; i++) {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(18); // 2 triangles * 3 vertices * 3 coords
      const posAttr = new THREE.BufferAttribute(posArray, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', posAttr);

      const mesh = new THREE.Mesh(geo, this.skidMat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.pool.push({
        mesh,
        geometry: geo,
        positionAttr: posAttr,
        life: 0,
        active: false,
      });
    }
  }

  addSkidMarks(leftTire: THREE.Vector3, rightTire: THREE.Vector3) {
    if (!this.hasLast) {
      this.lastLeftPos.copy(leftTire);
      this.lastRightPos.copy(rightTire);
      this.hasLast = true;
      return;
    }

    if (this.lastLeftPos.distanceTo(leftTire) < 0.45) return;

    // Use recycled quads for left and right tires
    this.updateSegment(this.lastLeftPos, leftTire);
    this.updateSegment(this.lastRightPos, rightTire);

    this.lastLeftPos.copy(leftTire);
    this.lastRightPos.copy(rightTire);
  }

  private updateSegment(p1: THREE.Vector3, p2: THREE.Vector3) {
    const segment = this.pool[this.poolIndex];
    this.poolIndex = (this.poolIndex + 1) % this.maxSegments;

    const width = 0.28;
    const dir = p2.clone().sub(p1).normalize();
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width * 0.5);

    const positions = segment.positionAttr.array as Float32Array;
    const yOff = 0.04;

    // Triangle 1
    positions[0] = p1.x - normal.x;
    positions[1] = p1.y + yOff;
    positions[2] = p1.z - normal.z;

    positions[3] = p1.x + normal.x;
    positions[4] = p1.y + yOff;
    positions[5] = p1.z + normal.z;

    positions[6] = p2.x - normal.x;
    positions[7] = p2.y + yOff;
    positions[8] = p2.z - normal.z;

    // Triangle 2
    positions[9] = p1.x + normal.x;
    positions[10] = p1.y + yOff;
    positions[11] = p1.z + normal.z;

    positions[12] = p2.x + normal.x;
    positions[13] = p2.y + yOff;
    positions[14] = p2.z + normal.z;

    positions[15] = p2.x - normal.x;
    positions[16] = p2.y + yOff;
    positions[17] = p2.z - normal.z;

    segment.positionAttr.needsUpdate = true;
    segment.life = 10.0;
    segment.active = true;
    segment.mesh.visible = true;
  }

  stopSkid() {
    this.hasLast = false;
  }

  update(delta: number) {
    for (let i = 0; i < this.maxSegments; i++) {
      const segment = this.pool[i];
      if (!segment.active) continue;

      segment.life -= delta;
      if (segment.life <= 0) {
        segment.active = false;
        segment.mesh.visible = false;
      }
    }
  }

  reset() {
    this.hasLast = false;
    for (let i = 0; i < this.maxSegments; i++) {
      this.pool[i].active = false;
      this.pool[i].life = 0;
      this.pool[i].mesh.visible = false;
    }
  }

  dispose() {
    this.reset();
    for (const segment of this.pool) {
      this.scene.remove(segment.mesh);
      segment.geometry.dispose();
    }
    this.skidMat.dispose();
    this.pool = [];
  }
}
