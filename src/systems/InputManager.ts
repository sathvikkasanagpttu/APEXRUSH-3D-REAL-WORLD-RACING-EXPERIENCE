import { VehicleInputs } from '../physics/VehiclePhysics';

export class InputManager {
  private keys: Record<string, boolean> = {};
  public inputs: VehicleInputs = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    boost: false,
  };

  // Virtual touch controls overrides
  public touchThrottle = 0;
  public touchBrake = 0;
  public touchSteer = 0;
  public touchHandbrake = false;
  public touchBoost = false;

  public onReset?: () => void;
  public onPause?: () => void;
  public onCameraToggle?: () => void;

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scrolling on arrow keys and space so browser does not jump
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || e.key === ' ') {
      e.preventDefault();
    }

    this.keys[e.code] = true;
    if (e.key) {
      this.keys[e.key.toLowerCase()] = true;
    }

    // Trigger one-shot control callbacks without repeat spam
    if (!e.repeat) {
      if ((e.code === 'KeyR' || e.key === 'r' || e.key === 'R') && this.onReset) {
        this.onReset();
      }
      if ((e.code === 'Escape' || e.key === 'Escape') && this.onPause) {
        this.onPause();
      }
      if ((e.code === 'KeyC' || e.key === 'c' || e.key === 'C') && this.onCameraToggle) {
        this.onCameraToggle();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    if (e.key) {
      this.keys[e.key.toLowerCase()] = false;
    }
  };

  private handleBlur = () => {
    // Clear all held keys if window loses focus to prevent stuck keys
    this.keys = {};
    this.resetTouchInputs();
  };

  public resetTouchInputs() {
    this.touchThrottle = 0;
    this.touchBrake = 0;
    this.touchSteer = 0;
    this.touchHandbrake = false;
    this.touchBoost = false;
  }

  update() {
    // Keyboard reading with case-insensitive and code fallbacks
    const isW = !!(this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w']);
    const isS = !!(this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s']);
    const isA = !!(this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a']);
    const isD = !!(this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d']);
    const isSpace = !!(this.keys['Space'] || this.keys[' ']);
    const isShift = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['shift']);

    // Combine keyboard and touch
    const kbThrottle = isW ? 1 : 0;
    const kbBrake = isS ? 1 : 0;
    const kbSteer = (isA ? -1 : 0) + (isD ? 1 : 0);
    const kbHandbrake = isSpace;
    const kbBoost = isShift;

    this.inputs.throttle = Math.max(kbThrottle, this.touchThrottle);
    this.inputs.brake = Math.max(kbBrake, this.touchBrake);
    this.inputs.steer = Math.abs(this.touchSteer) > 0.05 ? this.touchSteer : kbSteer;
    this.inputs.handbrake = kbHandbrake || this.touchHandbrake;
    this.inputs.boost = kbBoost || this.touchBoost;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.keys = {};
    this.resetTouchInputs();
  }
}
