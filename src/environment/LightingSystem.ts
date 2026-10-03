import * as THREE from 'three';
import { WeatherType, TimeOfDay } from '../data/gameTypes';

export class LightingSystem {
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;
  public fog: THREE.FogExp2;
  public rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;

  public gripMultiplier = 1.0;

  constructor(scene: THREE.Scene) {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x223344, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    this.dirLight.position.set(120, 180, 90);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 400;
    this.dirLight.shadow.camera.left = -150;
    this.dirLight.shadow.camera.right = 150;
    this.dirLight.shadow.camera.top = 150;
    this.dirLight.shadow.camera.bottom = -150;
    this.dirLight.shadow.bias = -0.0005;
    scene.add(this.dirLight);
    scene.add(this.dirLight.target);

    this.fog = new THREE.FogExp2(0xc2d8ec, 0.002);
    scene.fog = this.fog;

    this.setupRain(scene);
  }

  private setupRain(scene: THREE.Scene) {
    const rainCount = 2500;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 160;
      this.rainPositions[i * 3 + 1] = Math.random() * 45;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMaterial = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.35,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMaterial);
    this.rainParticles.visible = false;
    scene.add(this.rainParticles);
  }

  update(delta: number, playerPos: THREE.Vector3, isRaining: boolean) {
    if (this.rainParticles && this.rainPositions && this.rainGeometry) {
      if (isRaining) {
        this.rainParticles.visible = true;
        this.rainParticles.position.x = playerPos.x;
        this.rainParticles.position.z = playerPos.z;

        const count = this.rainPositions.length / 3;
        for (let i = 0; i < count; i++) {
          this.rainPositions[i * 3 + 1] -= delta * 55; // fall speed
          if (this.rainPositions[i * 3 + 1] < 0) {
            this.rainPositions[i * 3 + 1] = 45;
          }
        }
        this.rainGeometry.attributes.position.needsUpdate = true;
      } else {
        this.rainParticles.visible = false;
      }
    }

    // Follow player with directional light shadow box
    this.dirLight.position.set(playerPos.x + 80, playerPos.y + 120, playerPos.z + 60);
    this.dirLight.target.position.copy(playerPos);
    this.dirLight.target.updateMatrixWorld();
  }

  applyWeather(weather: WeatherType, timeOfDay: TimeOfDay, scene: THREE.Scene) {
    let sunColor = 0xfffaed;
    let sunIntensity = 1.8;
    let skyColor = 0xddeeff;
    let groundLight = 0x223344;
    let ambientIntensity = 0.4;
    let fogColor = 0xc2d8ec;
    let fogDensity = 0.002;
    let isRain = false;

    this.gripMultiplier = 1.0;

    // Time of day base
    switch (timeOfDay) {
      case 'DAWN':
        sunColor = 0xffa066;
        sunIntensity = 1.2;
        skyColor = 0xff8866;
        fogColor = 0x4a323a;
        ambientIntensity = 0.35;
        fogDensity = 0.0035;
        break;
      case 'DAY':
        sunColor = 0xfffaed;
        sunIntensity = 1.8;
        skyColor = 0x76b6ff;
        fogColor = 0x9ec7eb;
        ambientIntensity = 0.45;
        fogDensity = 0.002;
        break;
      case 'SUNSET':
        sunColor = 0xff6622;
        sunIntensity = 1.4;
        skyColor = 0xff5533;
        fogColor = 0x3d2222;
        ambientIntensity = 0.35;
        fogDensity = 0.003;
        break;
      case 'NIGHT':
        sunColor = 0x223355;
        sunIntensity = 0.25;
        skyColor = 0x070b14;
        groundLight = 0x03050a;
        fogColor = 0x05070d;
        ambientIntensity = 0.15;
        fogDensity = 0.004;
        break;
    }

    // Weather modifications
    switch (weather) {
      case 'CLOUDY':
        sunIntensity *= 0.6;
        fogDensity += 0.002;
        ambientIntensity *= 0.85;
        break;
      case 'RAIN':
        isRain = true;
        this.gripMultiplier = 0.76;
        sunIntensity *= 0.4;
        fogDensity += 0.0045;
        ambientIntensity *= 0.7;
        fogColor = 0x202630;
        break;
      case 'STORM':
        isRain = true;
        this.gripMultiplier = 0.65;
        sunIntensity *= 0.2;
        fogDensity += 0.007;
        ambientIntensity *= 0.5;
        fogColor = 0x12161f;
        break;
      case 'NIGHT':
        sunIntensity = 0.2;
        ambientIntensity = 0.12;
        fogColor = 0x06080e;
        break;
    }

    this.dirLight.color.setHex(sunColor);
    this.dirLight.intensity = sunIntensity;
    this.hemiLight.color.setHex(skyColor);
    this.hemiLight.groundColor.setHex(groundLight);
    this.ambientLight.intensity = ambientIntensity;

    this.fog.color.setHex(fogColor);
    this.fog.density = fogDensity;
    scene.background = new THREE.Color(fogColor);

    if (this.rainParticles) {
      this.rainParticles.visible = isRain;
    }
  }
}
