import * as THREE from 'three';

export interface AnimatedProp {
  update: (delta: number, elapsed: number) => void;
}

export interface BuiltEnvironment {
  group: THREE.Group;
  animatedProps: AnimatedProp[];
}

export class EnvironmentBuilder {
  static buildEnvironment(): BuiltEnvironment {
    const group = new THREE.Group();
    const animatedProps: AnimatedProp[] = [];

    // Terrain ground plane
    const groundGeo = new THREE.PlaneGeometry(1200, 1200, 64, 64);
    // Deform terrain around mountain sector
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i); // plane is rotated X
      if (x < 150 && x > -150 && z < -180 && z > -350) {
        // Mountain elevation
        const dist = Math.hypot(x, z + 260);
        pos.setZ(i, Math.max(0, 22 - dist * 0.15));
      }
    }
    groundGeo.computeVertexNormals();
    groundGeo.rotateX(-Math.PI / 2);

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -0.1;
    group.add(ground);

    // 1. CITY AREA: Skyscrapers & Commercial Buildings
    this.buildCitySector(group, animatedProps);

    // 2. HIGHWAY AREA: Overpasses, Street Lights & Highway Signs
    this.buildHighwaySector(group);

    // 3. MOUNTAIN AREA: Cliffs, Rocks & Pine Trees
    this.buildMountainSector(group);

    // 4. INDUSTRIAL AREA: Warehouses, Container Stacks, Cranes & Storage Tanks
    this.buildIndustrialSector(group, animatedProps);

    // 5. ANIMATED BACKGROUND TRAFFIC on distant perimeter roads
    this.buildBackgroundTraffic(group, animatedProps);

    return { group, animatedProps };
  }

  private static buildCitySector(group: THREE.Group, animatedProps: AnimatedProp[]) {
    // City center surrounds x: [-80..80], z: [-60..220]
    const buildingMatDark = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.3, metalness: 0.7 });
    const buildingMatGlass = new THREE.MeshStandardMaterial({ color: 0x1e2838, roughness: 0.1, metalness: 0.9 });
    const buildingMatWhite = new THREE.MeshStandardMaterial({ color: 0x2c3340, roughness: 0.4, metalness: 0.5 });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffeaad,
      emissive: 0xffeaad,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    const buildingCoords = [
      // Left side of city straight
      { x: -35, z: 20, w: 25, d: 25, h: 75, mat: buildingMatGlass },
      { x: -40, z: 70, w: 28, d: 24, h: 110, mat: buildingMatDark },
      { x: -45, z: 125, w: 30, d: 30, h: 90, mat: buildingMatWhite },
      { x: -40, z: 180, w: 22, d: 22, h: 65, mat: buildingMatGlass },
      { x: -75, z: 40, w: 35, d: 35, h: 130, mat: buildingMatDark },
      { x: -80, z: 100, w: 32, d: 32, h: 145, mat: buildingMatGlass },
      { x: -70, z: 160, w: 30, d: 30, h: 80, mat: buildingMatWhite },

      // Right side of city straight
      { x: 45, z: 20, w: 26, d: 26, h: 85, mat: buildingMatDark },
      { x: 50, z: 75, w: 28, d: 28, h: 120, mat: buildingMatGlass },
      { x: 55, z: 130, w: 24, d: 24, h: 100, mat: buildingMatWhite },
      { x: 60, z: 185, w: 30, d: 30, h: 70, mat: buildingMatDark },
      { x: 85, z: 40, w: 35, d: 35, h: 155, mat: buildingMatGlass },
      { x: 90, z: 110, w: 32, d: 32, h: 130, mat: buildingMatDark },
      { x: 95, z: 170, w: 28, d: 28, h: 95, mat: buildingMatWhite },
    ];

    buildingCoords.forEach(b => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
      bMesh.position.set(b.x, b.h / 2, b.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      group.add(bMesh);

      // Lit windows strips on skyscraper facades
      const winMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.1, b.h * 0.7, b.d + 0.1), windowMat);
      winMesh.position.set(b.x, b.h * 0.5, b.z);
      group.add(winMesh);

      // Architectural roof spires
      if (b.h > 100) {
        const spire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 1.5, 18, 8),
          new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9 })
        );
        spire.position.set(b.x, b.h + 9, b.z);
        group.add(spire);

        // Blinking aviation beacon on top
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.6, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        beacon.position.set(b.x, b.h + 18, b.z);
        group.add(beacon);

        animatedProps.push({
          update: (_, elapsed) => {
            const blink = Math.sin(elapsed * 4) > 0 ? 1 : 0.1;
            beacon.scale.setScalar(blink);
          },
        });
      }
    });

    // Animated Digital Billboards on skyscrapers
    const billboardMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const bb = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 0.4), billboardMat);
    bb.position.set(-25, 24, 70);
    bb.rotation.y = Math.PI / 4;
    group.add(bb);

    animatedProps.push({
      update: (_, elapsed) => {
        const hue = (elapsed * 0.15) % 1;
        billboardMat.color.setHSL(hue, 0.9, 0.55);
      },
    });

    // Street Lamps along city avenue
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });

    for (let z = 10; z < 200; z += 25) {
      [-12, 12].forEach(x => {
        const lamp = new THREE.Group();
        lamp.position.set(x, 0, z);

        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7, 8), lampMat);
        pole.position.y = 3.5;
        lamp.add(pole);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(x < 0 ? 1.5 : -1.5, 0.12, 0.12), lampMat);
        arm.position.set(x < 0 ? 0.75 : -0.75, 7, 0);
        lamp.add(arm);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bulbMat);
        bulb.position.set(x < 0 ? 1.4 : -1.4, 6.8, 0);
        lamp.add(bulb);

        group.add(lamp);
      });
    }
  }

  private static buildHighwaySector(group: THREE.Group) {
    // Highway sector x: [180..380], z: [-60..270]
    // Highway lamp posts with double-headed LED masts
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.7 });
    const lampGlow = new THREE.MeshBasicMaterial({ color: 0xffcc77 });

    const highwayPositions = [
      { x: 190, y: 5, z: 270 },
      { x: 270, y: 9, z: 250 },
      { x: 340, y: 9, z: 190 },
      { x: 375, y: 6, z: 110 },
      { x: 382, y: 3, z: 20 },
    ];

    highwayPositions.forEach(pos => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 9, 8), mastMat);
      pole.position.set(pos.x, pos.y + 4.5, pos.z + 10);
      group.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.8), lampGlow);
      head.position.set(pos.x, pos.y + 9, pos.z + 10);
      group.add(head);
    });
  }

  private static buildMountainSector(group: THREE.Group) {
    // Mountain sector x: [-140..180], z: [-320..-200]
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x4a433e,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });

    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1f3d24, roughness: 0.8 });

    // Procedural Mountain Cliffs / Rock Formations
    for (let i = 0; i < 45; i++) {
      const rx = (Math.random() - 0.5) * 320 + 20;
      const rz = -230 - Math.random() * 110;
      const scale = 8 + Math.random() * 18;

      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), rockMat);
      rock.position.set(rx, scale * 0.45, rz);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      group.add(rock);
    }

    // Pine Trees scattered across the ridge
    for (let t = 0; t < 120; t++) {
      const tx = (Math.random() - 0.5) * 340 + 10;
      const tz = -210 - Math.random() * 120;

      // Don't place trees inside the road
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 6), treeTrunkMat);
      trunk.position.y = 1.5;
      tree.add(trunk);

      for (let l = 0; l < 3; l++) {
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(2.2 - l * 0.5, 3.2 - l * 0.5, 6),
          treeFoliageMat
        );
        foliage.position.y = 3.2 + l * 1.8;
        foliage.castShadow = true;
        tree.add(foliage);
      }

      group.add(tree);
    }
  }

  private static buildIndustrialSector(group: THREE.Group, animatedProps: AnimatedProp[]) {
    // Industrial Sector x: [-220..-80], z: [-150..160]
    const warehouseMat = new THREE.MeshStandardMaterial({ color: 0x36404d, roughness: 0.7, metalness: 0.4 });
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.4, metalness: 0.6 });
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, roughness: 0.3, metalness: 0.7 });

    const containerColors = [0xbb2222, 0x1166bb, 0x228833, 0xee7711, 0x555555];

    // Warehouses
    const warehouseCoords = [
      { x: -220, z: -100, w: 40, d: 60, h: 16 },
      { x: -225, z: -20, w: 45, d: 70, h: 18 },
      { x: -210, z: 80, w: 35, d: 55, h: 15 },
      { x: -130, z: 120, w: 30, d: 45, h: 14 },
    ];

    warehouseCoords.forEach(wh => {
      const whMesh = new THREE.Mesh(new THREE.BoxGeometry(wh.w, wh.h, wh.d), warehouseMat);
      whMesh.position.set(wh.x, wh.h / 2, wh.z);
      whMesh.castShadow = true;
      whMesh.receiveShadow = true;
      group.add(whMesh);
    });

    // Large Oil Storage Tanks
    [-170, -190].forEach(x => {
      [15, -45].forEach(z => {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 14, 24), tankMat);
        tank.position.set(x, 7, z);
        tank.castShadow = true;
        group.add(tank);
      });
    });

    // Stacks of Shipping Containers
    for (let c = 0; c < 28; c++) {
      const col = containerColors[c % containerColors.length];
      const cMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.4 });
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 12), cMat);

      const gridX = -170 - (c % 4) * 8;
      const gridZ = -80 + Math.floor(c / 4) * 14;
      const stackY = ((c * 3) % 3) * 2.6 + 1.3;

      cMesh.position.set(gridX, stackY, gridZ);
      cMesh.castShadow = true;
      group.add(cMesh);
    }

    // Giant Harbor Crane with animated rotating boom
    const crane = new THREE.Group();
    crane.position.set(-200, 0, 30);

    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 28, 8), craneMat);
    base.position.y = 14;
    crane.add(base);

    const boomGroup = new THREE.Group();
    boomGroup.position.y = 28;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 36), craneMat);
    boom.position.z = 14;
    boomGroup.add(boom);
    crane.add(boomGroup);
    group.add(crane);

    animatedProps.push({
      update: (_, elapsed) => {
        boomGroup.rotation.y = Math.sin(elapsed * 0.4) * 0.4;
      },
    });

    // Wind Turbines in industrial periphery
    for (let w = 0; w < 3; w++) {
      const turbine = new THREE.Group();
      turbine.position.set(-260 - w * 25, 0, -40 + w * 60);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 45, 12), tankMat);
      pole.position.y = 22.5;
      turbine.add(pole);

      const blades = new THREE.Group();
      blades.position.set(0, 45, 1);

      for (let b = 0; b < 3; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 18, 0.15), tankMat);
        blade.position.y = 9;
        blade.rotation.z = (b * Math.PI * 2) / 3;
        blades.add(blade);
      }
      turbine.add(blades);
      group.add(turbine);

      animatedProps.push({
        update: (delta) => {
          blades.rotation.z += delta * 1.8;
        },
      });
    }
  }

  private static buildBackgroundTraffic(group: THREE.Group, animatedProps: AnimatedProp[]) {
    // Distant background traffic cars looping on the outer perimeter highway
    const carMat1 = new THREE.MeshBasicMaterial({ color: 0xff3333 });
    const carMat2 = new THREE.MeshBasicMaterial({ color: 0x3388ff });
    const carMat3 = new THREE.MeshBasicMaterial({ color: 0xeeeeee });

    const trafficCount = 12;
    const trafficCars: { mesh: THREE.Mesh; speed: number; progress: number; radius: number; height: number }[] = [];

    for (let i = 0; i < trafficCount; i++) {
      const mat = i % 3 === 0 ? carMat1 : i % 3 === 1 ? carMat2 : carMat3;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), mat);
      const radius = 280 + (i % 3) * 6;
      const height = 12;
      group.add(mesh);

      trafficCars.push({
        mesh,
        speed: 0.15 + (i % 3) * 0.05,
        progress: i / trafficCount,
        radius,
        height,
      });
    }

    animatedProps.push({
      update: (delta) => {
        trafficCars.forEach(tc => {
          tc.progress = (tc.progress + delta * tc.speed * 0.08) % 1;
          const angle = tc.progress * Math.PI * 2;
          tc.mesh.position.set(
            Math.cos(angle) * tc.radius,
            tc.height,
            Math.sin(angle) * tc.radius
          );
          tc.mesh.rotation.y = -angle + Math.PI / 2;
        });
      },
    });
  }
}
