import { CarCustomization, CarStats } from './gameTypes';

export const DEFAULT_CAR_CUSTOMIZATION: CarCustomization = {
  bodyColor: '#e10600', // Racing Red
  rimColor: '#1a1a1a',  // Matte Black
  interiorColor: '#111111',
  neonColor: '#00ffcc', // Cyber Cyan
  spoilerStyle: 1,      // Sport
  paintFinish: 'metallic',
  brakeColor: '#ffbb00', // Gold/Yellow Brembo style
  engineLevel: 1,
  tireLevel: 1,
  brakeLevel: 1,
};

export const COLOR_PALETTES = {
  body: [
    { name: 'Monza Red', value: '#e10600' },
    { name: 'Apex Blue', value: '#0066ff' },
    { name: 'Nardo Grey', value: '#606468' },
    { name: 'Viper Yellow', value: '#ffc800' },
    { name: 'Midnight Purple', value: '#3b0066' },
    { name: 'Phantom Black', value: '#0d0f12' },
    { name: 'Alpine White', value: '#f0f3f6' },
    { name: 'British Racing Green', value: '#004225' },
    { name: 'Atomic Orange', value: '#ff5500' },
  ],
  rims: [
    { name: 'Matte Black', value: '#151515' },
    { name: 'Gunmetal', value: '#444444' },
    { name: 'Silver Chrome', value: '#dcdcdc' },
    { name: 'Forged Bronze', value: '#8a6538' },
    { name: 'Race Gold', value: '#d4af37' },
  ],
  neon: [
    { name: 'Cyan Glow', value: '#00ffcc' },
    { name: 'Acid Green', value: '#39ff14' },
    { name: 'Neon Magenta', value: '#ff007f' },
    { name: 'Electric Blue', value: '#0055ff' },
    { name: 'Solar Amber', value: '#ff8800' },
    { name: 'Off / Stealth', value: 'transparent' },
  ],
  brakes: [
    { name: 'Brembo Red', value: '#e50000' },
    { name: 'Ceramic Gold', value: '#ffc400' },
    { name: 'Acid Yellow', value: '#ccff00' },
    { name: 'Stealth Black', value: '#222222' },
  ],
};

export function calculateCarStats(customization: CarCustomization): CarStats {
  const baseSpeed = 74;
  const baseAcc = 72;
  const baseHandling = 75;
  const baseBraking = 70;
  const baseGrip = 73;

  const engineBonus = (customization.engineLevel - 1) * 8;
  const tireBonus = (customization.tireLevel - 1) * 7;
  const brakeBonus = (customization.brakeLevel - 1) * 9;
  const spoilerBonus = customization.spoilerStyle === 2 ? 6 : customization.spoilerStyle === 1 ? 3 : 0;

  return {
    speed: Math.min(100, baseSpeed + engineBonus),
    acceleration: Math.min(100, baseAcc + engineBonus * 1.2),
    handling: Math.min(100, baseHandling + tireBonus * 0.8 + spoilerBonus),
    braking: Math.min(100, baseBraking + brakeBonus),
    grip: Math.min(100, baseGrip + tireBonus + spoilerBonus * 0.5),
  };
}
