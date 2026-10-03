# APEXRUSH 3D — REAL-WORLD RACING EXPERIENCE

A professional 3D car racing game prototype built with **React, Vite, Three.js, TypeScript, WebGL, Tailwind CSS, and Web Audio API**.

---

## 🏎️ Features & Highlights

### 1. 3D Vehicle & Simulation Physics
- **Procedural Supercar**: Detailed aerodynamics with carbon chassis, front splitter, side air intakes, rear diffuser, GT carbon wing, forged alloy rims, slotted brake discs with colored calipers, LED headlights with road-illuminating spotlights, reactive brake lights, dual exhaust tips, interior bucket seats, dashboard, and animated steering wheel.
- **Arcade-Simulation Physics Engine**:
  - Realistic longitudinal acceleration and aerodynamic drag curves.
  - Multi-gear transmission (6-speed auto gearbox + Reverse) with RPM tachometer curve (800–8500 RPM).
  - Speed-dependent steering sensitivity preventing spin-outs at 280+ km/h while allowing tight low-speed maneuvers.
  - Lateral tire slip and powerslide mechanics with drift scoring and combo multipliers.
  - Dynamic weight transfer: chassis nose dive on hard braking, squat under acceleration, and realistic roll during high-G cornering.
  - Wheel rotation speed coupled directly to velocity, and front wheels steer into turns.
  - Nitro boost surge system with exhaust fire and speed-blur FOV stretching.

### 2. Grand Continuous 3D World & Track Zones
- **Zone 01 — Metro City**: Multi-lane downtown boulevard flanked by skyscrapers, glowing windows, lit street lamps, digital neon billboards, and start/finish gantry with starting lights.
- **Zone 02 — Night Highway & Bridge**: Elevated expressway overpass supported by concrete pillars, double-headed LED masts, and high-speed underground tunnel with ceiling strip lights.
- **Zone 03 — Mountain Pass**: Winding hillclimb with dramatic elevation changes (0m to 18m), sheer cliffs, rocky boulders, pine forests, and tight hairpin apexes.
- **Zone 04 — Industrial District**: Shipping container stacks, corrugated warehouses, rotating harbor cranes, animated wind turbines, and technical chicanes.
- **Pit Lane**: Dedicated parallel pit lane with garage bays and repair/refuel facilities.
- **Animated World Props**: Rotating wind turbine blades, moving harbor cranes, color-cycling digital billboards, blinking skyscraper beacons, and distant background traffic.

### 3. AI Opponents & Personalities
- 6-7 dynamic AI racing opponents with distinct driver personalities:
  - **PRO** (Elena Rostova, Sophia Sterling): Precision racing lines, late braking, high top speed.
  - **AGGRESSIVE** (Lucas Thorne, Dante Ricci): Aggressive overtaking, high corner speed, lane pressure.
  - **BALANCED** (Kenji Sato): Consistent line, optimal throttle modulation.
  - **DEFENSIVE** (Marcus Vance): Lane blocking, early braking.
  - **BEGINNER** (Aria Chen): Gentle cornering.
- Intelligent waypoint spline navigation, curvature-based deceleration before turns, forward collision avoidance, and dynamic overtaking lane shifts.

### 4. Camera System (Cycle with `C`)
- **Chase Camera**: Smooth third-person follow with camera lag, speed-based FOV widening, subtle engine rumble shake, and cornering lead offset.
- **Hood Camera**: Low-slung front hood mount looking down the nose at the corner apex.
- **Cockpit Camera**: Interior first-person view behind the dashboard, steering wheel, and windshield.
- **Cinematic Camera**: Dynamic orbiting showcase angles for menus, start countdown, and victory laps.

### 5. Professional Motorsport HUD & Mini-Map
- Digital speedometer with KM/H readout and gear indicator (R, 1..6).
- Tachometer RPM bar with redline warning.
- Nitro boost meter with flame glow.
- Fuel gauge and visual damage meter.
- Lap counter (`LAP 1/3` to `FINAL LAP`) and real-time position badge (`P1/7`).
- Precision timers: current lap time, best lap, and total race time.
- Real-time GPS 2D mini-map showing track contour, checkpoints, player dot with heading, and AI car markers.
- Dynamic notification toasts: `OVERTAKE!`, `CHECKPOINT`, `FASTEST LAP`, `FINAL LAP`, `GREEN FLAG`.

### 6. 3D Interactive Garage & Customization
- Inspect the car in a 3D showroom with orbiting camera.
- Customize body paint colors (Monza Red, Apex Blue, Nardo Grey, Viper Yellow, Midnight Purple, etc.) and finishes (Metallic, Gloss, Matte).
- Alloy rim finishes (Matte Black, Gunmetal, Chrome, Bronze, Gold).
- Spoiler downforce styles (Clean, Sport Carbon Wing, GT Competition Wing).
- Chassis neon underglow colors (Cyan, Acid Green, Magenta, Electric Blue, Amber).
- Ceramic brake caliper colors (Red, Gold, Acid Yellow, Black).
- Performance tuning stages: Twin-Turbo ECU, Racing Compound Tires, Carbon Brakes.
- Live animated performance telemetry bars: Speed, Acceleration, Handling, Braking, Grip.

### 7. Game Modes & Career
- **Quick Race**: Compete against 6 AI opponents in a 3-lap sprint.
- **Time Trial**: Solo hot-lap session aiming to break lap records.
- **Championship Career**: 5 progressive rounds with stage unlocking and point standings.
- **Free Drive**: Open exploration of the 3D world without race timers.
- **Drift Mode**: Score points by linking powerslides through tight hairpins.

### 8. Web Audio API Synthesizer Engine
- Zero external MP3 downloads — 100% reliable synthesized motorsport audio:
  - Multi-oscillator engine roar with pitch-shifting RPM and low-pass filter modulation under throttle.
  - Resonant bandpass white-noise tire screech on drift and heavy braking.
  - Nitro boost turbine sweep.
  - Metallic barrier collision crash.
  - F1-style 3-2-1-GO! countdown tones and checkpoint crystal chimes.
  - Pit stop pneumatic wrench ratchets.
  - Background synthwave racing bassline and kick sequencer.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mobile |
|---|---|---|
| **Accelerate / Throttle** | `W` or `↑` | **GAS** Button |
| **Brake / Reverse** | `S` or `↓` | **BRAKE** Button |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | **Left / Right** Arrows |
| **Handbrake / Drift** | `SPACE` | **DRIFT** Button |
| **Nitro Boost** | `SHIFT` | **BOOST** Button |
| **Switch Camera Mode** | `C` | **Camera** Icon |
| **Reset Car to Track** | `R` | - |
| **Pause Race** | `ESC` | **PAUSE** Button |

---

## 🛠️ Project Structure

```text
src/
├── main.tsx                  # React entry point
├── App.tsx                   # Master app coordinator & state machine
├── index.css                 # Tailwind CSS & motorsport styling
├── vite-env.d.ts             # Vite client declarations
│
├── components/               # React UI & Overlay Components
│   ├── RacingCanvas.tsx      # WebGL Canvas wrapper for Three.js
│   ├── LoadingScreen.tsx     # Animated progress screen
│   ├── MainMenu.tsx          # 3D Main Menu with motorsport identity
│   ├── Garage.tsx            # Interactive 3D Garage & tuning
│   ├── TrackSelect.tsx       # Circuit, mode, weather & time selector
│   ├── Championship.tsx      # 5-stage career progression ladder
│   ├── HUD.tsx               # Speedometer, tachometer, boost, laps
│   ├── MiniMap.tsx           # Real-time 2D GPS track map
│   ├── TouchControls.tsx     # On-screen buttons for mobile/tablet
│   ├── PauseMenu.tsx         # ESC pause modal
│   ├── RaceResults.tsx       # Podiums, standings & confetti
│   ├── SettingsModal.tsx     # Graphics, audio & camera settings
│   └── HowToPlayModal.tsx    # Controls & tactics guide
│
├── game/                     # Core Game Systems
│   ├── GameEngine.ts         # Master Three.js scene & animation loop
│   └── RaceManager.ts        # Laps, checkpoints, timings & standings
│
├── physics/                  # Simulation
│   └── VehiclePhysics.ts     # Acceleration, grip, drift, gearbox & collisions
│
├── vehicles/                 # 3D Cars
│   ├── CarModelBuilder.ts    # Procedural sports supercar geometry builder
│   └── Vehicle.ts            # Player vehicle controller & wheel animations
│
├── tracks/                   # Circuit Architecture
│   ├── TrackData.ts          # Grand Circuit spline, checkpoints & zones
│   └── TrackBuilder.ts       # Extruded asphalt, curbs, barriers, tunnel, bridge
│
├── environment/              # World & Atmosphere
│   ├── EnvironmentBuilder.ts # City skyscrapers, highway, cliffs, warehouses
│   └── LightingSystem.ts     # Day/Night cycles, weather & rain particles
│
├── ai/                       # Artificial Intelligence
│   └── AIOpponent.ts         # 7 AI opponents with driver personalities
│
├── particles/                # Visual FX
│   ├── ParticleManager.ts    # Pooled tire smoke, exhaust flames & sparks
│   └── SkidMarkManager.ts    # Asphalt tire skid mark decals
│
├── audio/                    # Sound Synthesizer
│   └── AudioEngine.ts        # Web Audio API engine & music sequencer
│
├── camera/                   # Camera Direction
│   └── CameraSystem.ts       # Chase, Hood, Cockpit & Cinematic cameras
│
├── systems/                  # Device Input
│   └── InputManager.ts       # Keyboard, touch & gamepad handling
│
└── data/                     # Game Constants
    ├── gameTypes.ts          # Shared TypeScript interfaces & types
    ├── championshipData.ts   # 5 Championship race configurations
    └── garageData.ts         # Paint palettes, parts & stat algorithms
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```
