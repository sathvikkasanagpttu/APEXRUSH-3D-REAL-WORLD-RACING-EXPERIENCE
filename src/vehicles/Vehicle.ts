import * as THREE from 'three';
import { BuiltCarModel, CarModelBuilder } from './CarModelBuilder';
import { VehiclePhysics, VehicleInputs } from '../physics/VehiclePhysics';
import { CarCustomization, CarStats } from '../data/gameTypes';
import { audio } from '../audio/AudioEngine';

export class Vehicle {
  public model: BuiltCarModel;
  public physics: VehiclePhysics;
  public group: THREE.Group;

  private wheelSpinAngle = 0;
  private currentSteerAngle = 0;

  constructor(customization: CarCustomization, stats: CarStats, startPos: THREE.Vector3, startRotY = 0) {
    this.model = CarModelBuilder.buildSportsCar(customization, true);
    this.physics = new VehiclePhysics(stats, startPos, startRotY);
    this.group = this.model.root;
    this.updateTransform();
  }

  update(delta: number, inputs: VehicleInputs, gripModifier = 1.0) {
    // 1. Run physics step
    this.physics.update(delta, inputs, gripModifier);

    // 2. Update mesh transform
    this.updateTransform();

    // 3. Animate Wheels (Spin + Steering)
    // Wheel circumference ~ 2 * PI * 0.38m = 2.38m
    const wheelRollDelta = (this.physics.speedMs * delta) / 0.38;
    this.wheelSpinAngle += wheelRollDelta;

    // Front wheel steering angle (lerped)
    const targetSteerAngle = inputs.steer * 0.45;
    this.currentSteerAngle = THREE.MathUtils.lerp(this.currentSteerAngle, targetSteerAngle, delta * 15);

    // Apply front steering to wheel assemblies
    this.model.frontLeftWheel.rotation.y = this.currentSteerAngle;
    this.model.frontRightWheel.rotation.y = this.currentSteerAngle;

    // Apply wheel spinning to inner hubs
    const leftSpinHub = this.model.frontLeftWheel.children[0];
    const rightSpinHub = this.model.frontRightWheel.children[0];
    const rearLeftSpinHub = this.model.rearLeftWheel.children[0];
    const rearRightSpinHub = this.model.rearRightWheel.children[0];

    if (leftSpinHub) leftSpinHub.rotation.x = this.wheelSpinAngle;
    if (rightSpinHub) rightSpinHub.rotation.x = this.wheelSpinAngle;
    if (rearLeftSpinHub) rearLeftSpinHub.rotation.x = this.wheelSpinAngle;
    if (rearRightSpinHub) rearRightSpinHub.rotation.x = this.wheelSpinAngle;

    // 4. Animate Cockpit Steering Wheel
    if (this.model.steeringWheel) {
      this.model.steeringWheel.rotation.z = -inputs.steer * 1.2;
    }

    // 5. Animate Brake Lights
    if (inputs.brake > 0.1 || inputs.handbrake) {
      this.model.brakeLightMaterial.emissiveIntensity = 4.0;
    } else {
      this.model.brakeLightMaterial.emissiveIntensity = 0.8;
    }

    // 6. Sound Synchronization
    audio.updateEngine(this.physics.engineRpm, inputs.throttle, this.physics.speedKmh);

    if (this.physics.isDrifting || (inputs.brake > 0.5 && this.physics.speedKmh > 40)) {
      audio.setTireSqueal(Math.min(1.0, this.physics.driftAngle * 2.5));
    } else {
      audio.setTireSqueal(0);
    }
  }

  private updateTransform() {
    this.group.position.copy(this.physics.position);
    this.group.quaternion.copy(this.physics.quaternion);

    // Apply suspension pitch (squat & dive) and body roll (cornering) to body mesh
    this.model.bodyMesh.rotation.x = this.physics.pitch;
    this.model.bodyMesh.rotation.z = this.physics.roll;
  }

  reset(pos: THREE.Vector3, rotY: number) {
    this.physics.reset(pos, rotY);
    this.currentSteerAngle = 0;
    this.wheelSpinAngle = 0;
    this.updateTransform();
  }

  dispose() {
    this.model.materials.forEach(mat => mat.dispose());
  }
}
