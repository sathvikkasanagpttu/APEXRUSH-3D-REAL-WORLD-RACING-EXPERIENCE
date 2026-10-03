import * as THREE from 'three';

interface SkidSegment {
  mesh: THREE.Mesh;
  life: number;
}

export class SkidMarkManager {
  private skidPool: SkidSegment[] = [];
  private maxSkids = 120;
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
      opacity: 0.6,
      depthWrite: false,
    });
  }

  addSkidMarks(leftTire: THREE.Vector3, rightTire: THREE.Vector3) {
    if (!this.hasLast) {
      this.lastLeftPos.copy(leftTire);
      this.lastRightPos.copy(rightTire);
      this.hasLast = true;
      return;
    }

    if (this.lastLeftPos.distanceTo(leftTire) < 0.5) return;

    // Create quad for left tire
    this.createStrip(this.lastLeftPos, leftTire);
    // Create quad for right tire
    this.createStrip(this.lastRightPos, rightTire);

    this.lastLeftPos.copy(leftTire);
    this.lastRightPos.copy(rightTire);
  }

  private createStrip(p1: THREE.Vector3, p2: THREE.Vector3) {
    const width = 0.28;
    const dir = p2.clone().sub(p1).normalize();
    const normal = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(width * 0.5);

    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      p1.x - normal.x, p1.y + 0.04, p1.z - normal.z,
      p1.x + normal.x, p1.y + 0.04, p1.z + normal.z,
      p2.x - normal.x, p2.y + 0.04, p2.z - normal.z,

      p1.x + normal.x, p1.y + 0.04, p1.z + normal.z,
      p2.x + normal.x, p2.y + 0.04, p2.z + normal.z,
      p2.x - normal.x, p2.y + 0.04, p2.z - normal.z,
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const mesh = new THREE.Mesh(geo, this.skidMat);
    this.scene.add(mesh);

    this.skidPool.push({ mesh, life: 12.0 });

    if (this.skidPool.length > this.maxSkids) {
      const oldest = this.skidPool.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        oldest.mesh.geometry.dispose();
      }
    }
  }

  stopSkid() {
    this.hasLast = false;
  }

  update(delta: number) {
    for (let i = this.skidPool.length - 1; i >= 0; i--) {
      const segment = this.skidPool[i];
      segment.life -= delta;
      if (segment.life <= 0) {
        this.scene.remove(segment.mesh);
        segment.mesh.geometry.dispose();
        this.skidPool.splice(i, 1);
      }
    }
  }
}
