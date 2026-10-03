import * as THREE from 'three';
import { CarCustomization } from '../data/gameTypes';

export interface BuiltCarModel {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  brakeLightMaterial: THREE.MeshStandardMaterial;
  headlightMaterial: THREE.MeshStandardMaterial;
  headlights: THREE.SpotLight[];
  neonLight: THREE.PointLight | null;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  steeringWheel: THREE.Group;
  exhaustLeft: THREE.Vector3;
  exhaustRight: THREE.Vector3;
  hoodPosition: THREE.Vector3;
  cockpitPosition: THREE.Vector3;
  materials: THREE.Material[];
}

export class CarModelBuilder {
  static buildSportsCar(customization: CarCustomization, isPlayer = true): BuiltCarModel {
    const root = new THREE.Group();
    const materials: THREE.Material[] = [];

    // Body Material
    const roughness = customization.paintFinish === 'matte' ? 0.7 : customization.paintFinish === 'metallic' ? 0.25 : 0.4;
    const metalness = customization.paintFinish === 'matte' ? 0.1 : customization.paintFinish === 'metallic' ? 0.85 : 0.5;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(customization.bodyColor),
      roughness,
      metalness,
      envMapIntensity: 1.2,
    });
    materials.push(bodyMaterial);

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.5,
      metalness: 0.2,
    });
    materials.push(carbonMaterial);

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x111625,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.6,
      ior: 1.5,
    });
    materials.push(glassMaterial);

    const interiorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(customization.interiorColor),
      roughness: 0.8,
      metalness: 0.1,
    });
    materials.push(interiorMaterial);

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.1,
      metalness: 0.95,
    });
    materials.push(chromeMaterial);

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(customization.rimColor),
      roughness: 0.3,
      metalness: 0.8,
    });
    materials.push(rimMaterial);

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c1c1c,
      roughness: 0.85,
      metalness: 0.05,
    });
    materials.push(tireMaterial);

    const brakeCaliperMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(customization.brakeColor),
      roughness: 0.3,
      metalness: 0.6,
    });
    materials.push(brakeCaliperMaterial);

    const brakeDiscMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    });
    materials.push(brakeDiscMaterial);

    // Emissive lights
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.5,
      roughness: 0.2,
    });
    materials.push(headlightMaterial);

    const brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: 0xff0000,
      emissiveIntensity: 1.0,
      roughness: 0.3,
    });
    materials.push(brakeLightMaterial);

    // 1. Lower chassis / floor
    const chassisGeo = new THREE.BoxGeometry(1.85, 0.25, 4.3);
    const chassis = new THREE.Mesh(chassisGeo, carbonMaterial);
    chassis.position.set(0, 0.32, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    // 2. Main aerodynamic body shell
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.42, 4.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
    bodyMesh.position.set(0, 0.55, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);

    // Hood taper / nose
    const noseGeo = new THREE.BoxGeometry(1.7, 0.22, 1.2);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMaterial);
    noseMesh.position.set(0, 0.48, 1.8);
    noseMesh.rotation.x = 0.08;
    noseMesh.castShadow = true;
    root.add(noseMesh);

    // Front Splitter
    const splitterGeo = new THREE.BoxGeometry(1.9, 0.06, 0.9);
    const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitterMesh.position.set(0, 0.22, 2.05);
    splitterMesh.castShadow = true;
    root.add(splitterMesh);

    // Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.48, 1.9);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, 0.95, -0.2);
    cabinMesh.castShadow = true;
    root.add(cabinMesh);

    // Roof cap
    const roofGeo = new THREE.BoxGeometry(1.3, 0.06, 1.5);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMaterial);
    roofMesh.position.set(0, 1.2, -0.2);
    roofMesh.castShadow = true;
    root.add(roofMesh);

    // Side air intakes
    const intakeLeftGeo = new THREE.BoxGeometry(0.12, 0.3, 0.8);
    const intakeLeft = new THREE.Mesh(intakeLeftGeo, carbonMaterial);
    intakeLeft.position.set(-0.92, 0.52, -0.4);
    root.add(intakeLeft);

    const intakeRight = intakeLeft.clone();
    intakeRight.position.set(0.92, 0.52, -0.4);
    root.add(intakeRight);

    // Side mirrors
    const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.18);
    const mirrorLeft = new THREE.Mesh(mirrorGeo, bodyMaterial);
    mirrorLeft.position.set(-0.85, 0.9, 0.4);
    mirrorLeft.rotation.y = -0.2;
    root.add(mirrorLeft);

    const mirrorRight = new THREE.Mesh(mirrorGeo, bodyMaterial);
    mirrorRight.position.set(0.85, 0.9, 0.4);
    mirrorRight.rotation.y = 0.2;
    root.add(mirrorRight);

    // Rear diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.75, 0.22, 0.5);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, 0.28, -2.15);
    diffuser.rotation.x = -0.15;
    root.add(diffuser);

    // Rear Spoiler
    if (customization.spoilerStyle > 0) {
      const stanchionGeo = new THREE.BoxGeometry(0.06, 0.35, 0.18);
      const stanchionL = new THREE.Mesh(stanchionGeo, carbonMaterial);
      stanchionL.position.set(-0.55, 0.95, -1.9);
      root.add(stanchionL);

      const stanchionR = new THREE.Mesh(stanchionGeo, carbonMaterial);
      stanchionR.position.set(0.55, 0.95, -1.9);
      root.add(stanchionR);

      const wingWidth = customization.spoilerStyle === 2 ? 1.85 : 1.5;
      const wingGeo = new THREE.BoxGeometry(wingWidth, 0.05, 0.35);
      const wingMesh = new THREE.Mesh(wingGeo, carbonMaterial);
      wingMesh.position.set(0, 1.15, -1.92);
      wingMesh.rotation.x = 0.05;
      wingMesh.castShadow = true;
      root.add(wingMesh);

      // Wing endplates
      const endplateGeo = new THREE.BoxGeometry(0.03, 0.2, 0.4);
      const endplateL = new THREE.Mesh(endplateGeo, carbonMaterial);
      endplateL.position.set(-wingWidth / 2, 1.15, -1.92);
      root.add(endplateL);

      const endplateR = new THREE.Mesh(endplateGeo, carbonMaterial);
      endplateR.position.set(wingWidth / 2, 1.15, -1.92);
      root.add(endplateR);
    }

    // Headlights (3D geometry + emissive mesh)
    const hlGeo = new THREE.BoxGeometry(0.38, 0.1, 0.15);
    const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
    hlL.position.set(-0.65, 0.58, 2.12);
    hlL.rotation.y = -0.2;
    root.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, headlightMaterial);
    hlR.position.set(0.65, 0.58, 2.12);
    hlR.rotation.y = 0.2;
    root.add(hlR);

    // Headlight Spotlights for road illumination (only on player vehicle to prevent GPU light limit)
    const headlights: THREE.SpotLight[] = [];
    if (isPlayer) {
      const spotL = new THREE.SpotLight(0xffffff, 4, 45, Math.PI / 6, 0.3, 1.2);
      spotL.position.set(-0.65, 0.6, 2.15);
      spotL.target.position.set(-0.65, 0, 18);
      root.add(spotL);
      root.add(spotL.target);
      headlights.push(spotL);

      const spotR = new THREE.SpotLight(0xffffff, 4, 45, Math.PI / 6, 0.3, 1.2);
      spotR.position.set(0.65, 0.6, 2.15);
      spotR.target.position.set(0.65, 0, 18);
      root.add(spotR);
      root.add(spotR.target);
      headlights.push(spotR);
    }

    // Taillights
    const tlGeo = new THREE.BoxGeometry(1.6, 0.08, 0.1);
    const tlMesh = new THREE.Mesh(tlGeo, brakeLightMaterial);
    tlMesh.position.set(0, 0.68, -2.12);
    root.add(tlMesh);

    // Dual Exhaust tips
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 16);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhL = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exhL.position.set(-0.45, 0.32, -2.18);
    root.add(exhL);

    const exhR = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exhR.position.set(0.45, 0.32, -2.18);
    root.add(exhR);

    // Interior Cockpit & Steering Wheel
    const cockpitGroup = new THREE.Group();
    cockpitGroup.position.set(0, 0.55, 0);

    // Dash
    const dashGeo = new THREE.BoxGeometry(1.2, 0.25, 0.5);
    const dash = new THREE.Mesh(dashGeo, interiorMaterial);
    dash.position.set(0, 0.2, 0.45);
    cockpitGroup.add(dash);

    // Driver Seat
    const seatGeo = new THREE.BoxGeometry(0.5, 0.65, 0.5);
    const seat = new THREE.Mesh(seatGeo, interiorMaterial);
    seat.position.set(-0.35, 0.25, -0.3);
    cockpitGroup.add(seat);

    // Steering column and wheel
    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(-0.35, 0.35, 0.22);
    steeringWheel.rotation.x = -0.3;

    const ringGeo = new THREE.TorusGeometry(0.16, 0.025, 8, 24);
    const ringMesh = new THREE.Mesh(ringGeo, carbonMaterial);
    steeringWheel.add(ringMesh);

    const centerGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12);
    centerGeo.rotateX(Math.PI / 2);
    const centerMesh = new THREE.Mesh(centerGeo, chromeMaterial);
    steeringWheel.add(centerMesh);

    cockpitGroup.add(steeringWheel);
    root.add(cockpitGroup);

    // Underglow Neon
    let neonLight: THREE.PointLight | null = null;
    if (isPlayer && customization.neonColor && customization.neonColor !== 'transparent') {
      neonLight = new THREE.PointLight(new THREE.Color(customization.neonColor), 2.5, 5, 2);
      neonLight.position.set(0, 0.1, 0);
      root.add(neonLight);

      // Neon strip under car
      const neonGeo = new THREE.BoxGeometry(1.5, 0.03, 2.8);
      const neonMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(customization.neonColor),
      });
      materials.push(neonMat);
      const neonMesh = new THREE.Mesh(neonGeo, neonMat);
      neonMesh.position.set(0, 0.15, 0);
      root.add(neonMesh);
    }

    // 4 Wheels (Assemblies with steering pivots for front wheels)
    const wheelRadius = 0.38;
    const wheelWidth = 0.28;

    const createWheel = (isFront: boolean, isLeft: boolean): THREE.Group => {
      const wheelAssembly = new THREE.Group();

      // Spinning hub inside assembly
      const spinHub = new THREE.Group();
      wheelAssembly.add(spinHub);

      // Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMaterial);
      tire.castShadow = true;
      spinHub.add(tire);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.01, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMaterial);
      spinHub.add(rim);

      // Rim spokes
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(wheelWidth + 0.02, 0.04, wheelRadius * 0.65);
        const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
        spoke.rotation.x = (s * Math.PI) / 2.5;
        spinHub.add(spoke);
      }

      // Brake Disc (inside rim)
      const discGeo = new THREE.CylinderGeometry(wheelRadius * 0.58, wheelRadius * 0.58, 0.04, 16);
      discGeo.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, brakeDiscMaterial);
      disc.position.x = isLeft ? 0.04 : -0.04;
      spinHub.add(disc);

      // Brake Caliper (static relative to assembly, doesn't spin)
      const caliperGeo = new THREE.BoxGeometry(0.1, 0.14, 0.2);
      const caliper = new THREE.Mesh(caliperGeo, brakeCaliperMaterial);
      caliper.position.set(isLeft ? 0.08 : -0.08, 0.16, 0);
      wheelAssembly.add(caliper);

      return wheelAssembly;
    };

    const frontLeftWheel = createWheel(true, true);
    frontLeftWheel.position.set(-0.95, wheelRadius, 1.4);
    root.add(frontLeftWheel);

    const frontRightWheel = createWheel(true, false);
    frontRightWheel.position.set(0.95, wheelRadius, 1.4);
    root.add(frontRightWheel);

    const rearLeftWheel = createWheel(false, true);
    rearLeftWheel.position.set(-0.95, wheelRadius, -1.35);
    root.add(rearLeftWheel);

    const rearRightWheel = createWheel(false, false);
    rearRightWheel.position.set(0.95, wheelRadius, -1.35);
    root.add(rearRightWheel);

    return {
      root,
      bodyMesh,
      brakeLightMaterial,
      headlightMaterial,
      headlights,
      neonLight,
      frontLeftWheel,
      frontRightWheel,
      rearLeftWheel,
      rearRightWheel,
      steeringWheel,
      exhaustLeft: new THREE.Vector3(-0.45, 0.32, -2.25),
      exhaustRight: new THREE.Vector3(0.45, 0.32, -2.25),
      hoodPosition: new THREE.Vector3(0, 0.85, 1.2),
      cockpitPosition: new THREE.Vector3(-0.35, 1.05, -0.15),
      materials,
    };
  }
}
