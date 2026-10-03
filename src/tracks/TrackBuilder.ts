import * as THREE from 'three';
import { TrackData } from './TrackData';

export interface BuiltTrack {
  group: THREE.Group;
  roadMesh: THREE.Mesh;
  startFinishGantry: THREE.Group;
  checkpoints: { index: number; position: THREE.Vector3; direction: THREE.Vector3; width: number; zone: string }[];
  curve: THREE.CatmullRomCurve3;
  trackLength: number;
  barriers: THREE.Box3[];
}

export class TrackBuilder {
  static buildTrack(): BuiltTrack {
    const group = new THREE.Group();
    const curve = TrackData.getCurve();
    const checkpoints = TrackData.getCheckpoints();
    const trackLength = curve.getLength();
    const barriers: THREE.Box3[] = [];

    const segments = 400;
    const roadVertices: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    // Curb vertices
    const curbLeftVertices: number[] = [];
    const curbLeftColors: number[] = [];
    const curbLeftIndices: number[] = [];

    const curbRightVertices: number[] = [];
    const curbRightColors: number[] = [];
    const curbRightIndices: number[] = [];

    // Wall/Barrier vertices
    const wallLeftVertices: number[] = [];
    const wallLeftIndices: number[] = [];
    const wallRightVertices: number[] = [];
    const wallRightIndices: number[] = [];

    let vertexOffset = 0;
    let curbLOffset = 0;
    let curbROffset = 0;
    let wallLOffset = 0;
    let wallROffset = 0;

    const upVector = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, upVector).normalize();

      // Dynamic track width based on closest waypoint
      const halfWidth = 8.5; // standard width 17m

      // Road left and right
      const leftPt = point.clone().addScaledVector(normal, -halfWidth);
      const rightPt = point.clone().addScaledVector(normal, halfWidth);

      // Lift slightly above terrain to prevent z-fighting
      leftPt.y += 0.05;
      rightPt.y += 0.05;

      roadVertices.push(leftPt.x, leftPt.y, leftPt.z);
      roadVertices.push(rightPt.x, rightPt.y, rightPt.z);

      roadUvs.push(0, u * 120);
      roadUvs.push(1, u * 120);

      if (i < segments) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        roadIndices.push(row1, row1 + 1, row2);
        roadIndices.push(row1 + 1, row2 + 1, row2);
      }

      // Curbs (rumble strips) on outer edges
      const curbWidth = 1.0;
      const curbHeight = 0.12;

      // Left curb
      const curbLOuter = leftPt.clone().addScaledVector(normal, -curbWidth);
      curbLOuter.y += curbHeight;
      curbLeftVertices.push(leftPt.x, leftPt.y, leftPt.z);
      curbLeftVertices.push(curbLOuter.x, curbLOuter.y, curbLOuter.z);

      // Alternating red and white colors
      const isRed = (Math.floor(u * 200) % 2) === 0;
      const r = isRed ? 0.9 : 0.95;
      const g = isRed ? 0.1 : 0.95;
      const b = isRed ? 0.1 : 0.95;
      curbLeftColors.push(r, g, b, r, g, b);

      if (i < segments) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        curbLeftIndices.push(r1, r1 + 1, r2);
        curbLeftIndices.push(r1 + 1, r2 + 1, r2);
      }

      // Right curb
      const curbROuter = rightPt.clone().addScaledVector(normal, curbWidth);
      curbROuter.y += curbHeight;
      curbRightVertices.push(rightPt.x, rightPt.y, rightPt.z);
      curbRightVertices.push(curbROuter.x, curbROuter.y, curbROuter.z);
      curbRightColors.push(r, g, b, r, g, b);

      if (i < segments) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        curbRightIndices.push(r1, r1 + 1, r2);
        curbRightIndices.push(r1 + 1, r2 + 1, r2);
      }

      // Concrete / Guardrail barrier walls
      const barrierHeight = 1.1;
      const barrierDist = halfWidth + curbWidth + 0.3;
      const bLBase = point.clone().addScaledVector(normal, -barrierDist);
      const bLTop = bLBase.clone();
      bLTop.y += barrierHeight;

      const bRBase = point.clone().addScaledVector(normal, barrierDist);
      const bRTop = bRBase.clone();
      bRTop.y += barrierHeight;

      wallLeftVertices.push(bLBase.x, bLBase.y, bLBase.z);
      wallLeftVertices.push(bLTop.x, bLTop.y, bLTop.z);

      wallRightVertices.push(bRBase.x, bRBase.y, bRBase.z);
      wallRightVertices.push(bRTop.x, bRTop.y, bRTop.z);

      if (i < segments) {
        const r1 = i * 2;
        const r2 = (i + 1) * 2;
        wallLeftIndices.push(r1, r2, r1 + 1);
        wallLeftIndices.push(r1 + 1, r2, r2 + 1);

        wallRightIndices.push(r1, r1 + 1, r2);
        wallRightIndices.push(r1 + 1, r2 + 1, r2);
      }
    }

    // Procedural asphalt canvas texture
    const roadTexture = TrackBuilder.createAsphaltTexture();
    roadTexture.wrapS = THREE.RepeatWrapping;
    roadTexture.wrapT = THREE.RepeatWrapping;
    roadTexture.repeat.set(1, 120);

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Left Curbs
    const curbLGeo = new THREE.BufferGeometry();
    curbLGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbLeftVertices, 3));
    curbLGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbLeftColors, 3));
    curbLGeo.setIndex(curbLeftIndices);
    curbLGeo.computeVertexNormals();
    const curbMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.6,
      metalness: 0.1,
    });
    const curbLMesh = new THREE.Mesh(curbLGeo, curbMat);
    curbLMesh.receiveShadow = true;
    group.add(curbLMesh);

    // Right Curbs
    const curbRGeo = new THREE.BufferGeometry();
    curbRGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbRightVertices, 3));
    curbRGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbRightColors, 3));
    curbRGeo.setIndex(curbRightIndices);
    curbRGeo.computeVertexNormals();
    const curbRMesh = new THREE.Mesh(curbRGeo, curbMat);
    curbRMesh.receiveShadow = true;
    group.add(curbRMesh);

    // Armco Guardrails
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x9099a2,
      roughness: 0.4,
      metalness: 0.6,
    });

    const wallLGeo = new THREE.BufferGeometry();
    wallLGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallLeftVertices, 3));
    wallLGeo.setIndex(wallLeftIndices);
    wallLGeo.computeVertexNormals();
    const wallLMesh = new THREE.Mesh(wallLGeo, wallMat);
    wallLMesh.castShadow = true;
    wallLMesh.receiveShadow = true;
    group.add(wallLMesh);

    const wallRGeo = new THREE.BufferGeometry();
    wallRGeo.setAttribute('position', new THREE.Float32BufferAttribute(wallRightVertices, 3));
    wallRGeo.setIndex(wallRightIndices);
    wallRGeo.computeVertexNormals();
    const wallRMesh = new THREE.Mesh(wallRGeo, wallMat);
    wallRMesh.castShadow = true;
    wallRMesh.receiveShadow = true;
    group.add(wallRMesh);

    // Start / Finish Gantry
    const startFinishGantry = TrackBuilder.buildStartFinishGantry(curve);
    group.add(startFinishGantry);

    // Tunnel Enclosure (WP 10 to WP 12)
    const tunnel = TrackBuilder.buildTunnel(curve);
    group.add(tunnel);

    // Highway Bridge Supports (WP 5 to WP 7)
    const bridge = TrackBuilder.buildBridgePillars(curve);
    group.add(bridge);

    // Pit Lane parallel section
    const pitLane = TrackBuilder.buildPitLane();
    group.add(pitLane);

    // Overhead Sponsor Signs & Brake Markers along the circuit
    const signs = TrackBuilder.buildTrackSigns(curve);
    group.add(signs);

    return {
      group,
      roadMesh,
      startFinishGantry,
      checkpoints,
      curve,
      trackLength,
      barriers,
    };
  }

  private static createAsphaltTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Asphalt dark gravel base
    ctx.fillStyle = '#222326';
    ctx.fillRect(0, 0, 512, 512);

    // Grain texture
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 25);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Outer solid white road line (Left)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(35, 0, 8, 512);

    // Outer solid white road line (Right)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(512 - 43, 0, 8, 512);

    // Center dashed white line (lane divider)
    ctx.fillStyle = '#f5f5f5';
    for (let y = 0; y < 512; y += 48) {
      ctx.fillRect(253, y, 6, 28);
    }

    // Secondary dashed lane markings for 4-lane width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let y = 0; y < 512; y += 48) {
      ctx.fillRect(144, y, 4, 28);
      ctx.fillRect(364, y, 4, 28);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  private static buildStartFinishGantry(curve: THREE.CatmullRomCurve3): THREE.Group {
    const gantry = new THREE.Group();
    const pt = curve.getPointAt(0);
    const tangent = curve.getTangentAt(0).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    gantry.position.copy(pt);
    gantry.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

    // Arch Truss
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1a2230,
      metalness: 0.8,
      roughness: 0.3,
    });

    const leftCol = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.8), trussMat);
    leftCol.position.set(-10, 4, 0);
    gantry.add(leftCol);

    const rightCol = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8, 0.8), trussMat);
    rightCol.position.set(10, 4, 0);
    gantry.add(rightCol);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(21, 1.2, 1.2), trussMat);
    topBeam.position.set(0, 7.8, 0);
    gantry.add(topBeam);

    // APEXRUSH 3D Banner
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0xe10600 });
    const banner = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 0.2), bannerMat);
    banner.position.set(0, 6.8, 0.2);
    gantry.add(banner);

    // Starting Lights (5 red lights)
    const lightFrame = new THREE.Mesh(new THREE.BoxGeometry(6, 1.0, 0.3), trussMat);
    lightFrame.position.set(0, 5.4, 0.3);
    gantry.add(lightFrame);

    for (let i = -2; i <= 2; i++) {
      const redLight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff2200, emissiveIntensity: 2.0 })
      );
      redLight.rotateX(Math.PI / 2);
      redLight.position.set(i * 0.9, 5.4, 0.5);
      gantry.add(redLight);
    }

    // Checkered Start/Finish Strip on road
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 256;
    checkerCanvas.height = 64;
    const ctx = checkerCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#111111';
    for (let x = 0; x < 256; x += 16) {
      for (let y = 0; y < 64; y += 16) {
        if (((x / 16) + (y / 16)) % 2 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    const stripMat = new THREE.MeshBasicMaterial({ map: checkerTex });
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(17, 3), stripMat);
    strip.rotateX(-Math.PI / 2);
    strip.position.set(0, 0.08, 0);
    gantry.add(strip);

    return gantry;
  }

  private static buildTunnel(curve: THREE.CatmullRomCurve3): THREE.Group {
    const tunnelGroup = new THREE.Group();
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x24272c,
      roughness: 0.9,
      metalness: 0.1,
    });
    const lampMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
    });

    const segments = 40;
    // Tunnel covers u ~ 0.35 to 0.45
    const uStart = 0.35;
    const uEnd = 0.44;

    for (let i = 0; i < segments; i++) {
      const u = uStart + (i / segments) * (uEnd - uStart);
      const pt = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();

      const arch = new THREE.Mesh(new THREE.TorusGeometry(9, 1.2, 8, 16, Math.PI), tunnelMat);
      arch.position.copy(pt);
      arch.position.y += 0.5;
      arch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      arch.rotateZ(Math.PI);
      tunnelGroup.add(arch);

      // Tunnel roof strip lights
      if (i % 2 === 0) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 3), lampMat);
        lamp.position.copy(pt);
        lamp.position.y += 8.2;
        lamp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        tunnelGroup.add(lamp);

        // Warm interior tunnel point light
        if (i % 6 === 0) {
          const pLight = new THREE.PointLight(0xff9922, 2.0, 20);
          pLight.position.copy(lamp.position);
          tunnelGroup.add(pLight);
        }
      }
    }

    return tunnelGroup;
  }

  private static buildBridgePillars(curve: THREE.CatmullRomCurve3): THREE.Group {
    const bridgeGroup = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x4a5058,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Bridge zone u ~ 0.18 to 0.28
    const uStart = 0.18;
    const uEnd = 0.28;
    const steps = 6;

    for (let i = 0; i <= steps; i++) {
      const u = uStart + (i / steps) * (uEnd - uStart);
      const pt = curve.getPointAt(u);

      if (pt.y > 2) {
        // Concrete support column
        const column = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, pt.y + 2, 16), pillarMat);
        column.position.set(pt.x, (pt.y + 2) / 2 - 2, pt.z);
        column.castShadow = true;
        bridgeGroup.add(column);

        // Cross-beam support
        const beam = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 2.5), pillarMat);
        beam.position.set(pt.x, pt.y - 0.7, pt.z);
        bridgeGroup.add(beam);
      }
    }

    return bridgeGroup;
  }

  private static buildPitLane(): THREE.Group {
    const pit = new THREE.Group();

    // Pit lane road on the right of the main straight
    const pitRoadMat = new THREE.MeshStandardMaterial({
      color: 0x1f2124,
      roughness: 0.8,
    });
    const pitRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 120), pitRoadMat);
    pitRoad.rotateX(-Math.PI / 2);
    pitRoad.position.set(14, 0.06, 40);
    pitRoad.receiveShadow = true;
    pit.add(pitRoad);

    // Pit building / garages
    const garageMat = new THREE.MeshStandardMaterial({
      color: 0x1b2029,
      roughness: 0.6,
      metalness: 0.4,
    });
    const pitBuilding = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 110), garageMat);
    pitBuilding.position.set(24, 3, 40);
    pitBuilding.castShadow = true;
    pitBuilding.receiveShadow = true;
    pit.add(pitBuilding);

    // Garage door bays
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x0f131a, metalness: 0.8 });
    for (let z = 0; z < 100; z += 12) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 8), doorMat);
      door.position.set(18.8, 1.8, z);
      pit.add(door);
    }

    // Pit divider wall with speed limit 60 sign
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x889098 });
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 110), wallMat);
    divider.position.set(9.6, 0.6, 40);
    pit.add(divider);

    return pit;
  }

  private static buildTrackSigns(curve: THREE.CatmullRomCurve3): THREE.Group {
    const signsGroup = new THREE.Group();

    const signTexts = [
      { u: 0.08, brand: 'APEX RUSH', color: 0xe10600 },
      { u: 0.15, brand: 'BREMBO RACING', color: 0xd92b27 },
      { u: 0.28, brand: 'PIRELLI ZERO', color: 0xffd200 },
      { u: 0.48, brand: 'MOTUL SYNTHETIC', color: 0xc8102e },
      { u: 0.60, brand: 'HAIRPIN APEX', color: 0xff6600 },
      { u: 0.72, brand: 'NITRO ENERGY', color: 0x00ccff },
      { u: 0.88, brand: 'FINAL SECTOR', color: 0x33ff66 },
    ];

    signTexts.forEach(sign => {
      const pt = curve.getPointAt(sign.u);
      const tangent = curve.getTangentAt(sign.u).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const signFrame = new THREE.Group();
      signFrame.position.copy(pt);
      signFrame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Overhead arch
      const archMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.7 });
      const boardMat = new THREE.MeshStandardMaterial({
        color: sign.color,
        emissive: sign.color,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });

      const pL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), archMat);
      pL.position.set(-10, 3.5, 0);
      signFrame.add(pL);

      const pR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), archMat);
      pR.position.set(10, 3.5, 0);
      signFrame.add(pR);

      const board = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 0.3), boardMat);
      board.position.set(0, 6.2, 0);
      signFrame.add(board);

      signsGroup.add(signFrame);
    });

    return signsGroup;
  }
}
