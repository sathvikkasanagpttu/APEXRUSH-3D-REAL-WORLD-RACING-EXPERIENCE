import * as THREE from 'three';

export interface TrackWaypoint {
  pos: THREE.Vector3;
  width: number;
  zone: string;
  isTunnel?: boolean;
  isBridge?: boolean;
}

export class TrackData {
  // Master Spline Points defining the Grand Circuit
  static readonly WAYPOINTS: TrackWaypoint[] = [
    // --- ZONE 1: METRO CITY (Main Straight & Starting Grid) ---
    { pos: new THREE.Vector3(0, 0, 0), width: 18, zone: 'METRO CITY' },                 // WP 0: Start/Finish
    { pos: new THREE.Vector3(0, 0, 100), width: 18, zone: 'METRO CITY' },               // WP 1: City Straight
    { pos: new THREE.Vector3(15, 0, 180), width: 17, zone: 'METRO CITY' },              // WP 2: Gentle kink
    { pos: new THREE.Vector3(50, 0, 240), width: 16, zone: 'METRO CITY' },              // WP 3: City Turn 1 Entry
    { pos: new THREE.Vector3(110, 0, 270), width: 16, zone: 'METRO CITY' },             // WP 4: 90-degree City Corner

    // --- ZONE 2: HIGHWAY SECTOR & BRIDGE ---
    { pos: new THREE.Vector3(180, 4, 270), width: 16, zone: 'HIGHWAY EXPRESS', isBridge: true }, // WP 5: Highway Overpass
    { pos: new THREE.Vector3(260, 8, 250), width: 16, zone: 'HIGHWAY EXPRESS', isBridge: true }, // WP 6: High Bridge Apex
    { pos: new THREE.Vector3(330, 8, 200), width: 16, zone: 'HIGHWAY EXPRESS', isBridge: true }, // WP 7: High Speed Highway
    { pos: new THREE.Vector3(370, 5, 120), width: 15, zone: 'HIGHWAY EXPRESS' },        // WP 8: Sweeping Right
    { pos: new THREE.Vector3(380, 2, 30), width: 15, zone: 'HIGHWAY EXPRESS' },         // WP 9: Tunnel Entry Descent

    // --- HIGHWAY TUNNEL SECTION ---
    { pos: new THREE.Vector3(360, 0, -60), width: 14, zone: 'HIGHWAY EXPRESS', isTunnel: true }, // WP 10: Tunnel Middle
    { pos: new THREE.Vector3(310, 0, -140), width: 14, zone: 'HIGHWAY EXPRESS', isTunnel: true }, // WP 11: Tunnel Curve
    { pos: new THREE.Vector3(250, 2, -200), width: 15, zone: 'HIGHWAY EXPRESS' },        // WP 12: Tunnel Exit

    // --- ZONE 3: MOUNTAIN PASS (Elevation & Hairpins) ---
    { pos: new THREE.Vector3(180, 8, -240), width: 14, zone: 'MOUNTAIN PASS' },         // WP 13: Mountain Incline
    { pos: new THREE.Vector3(100, 15, -270), width: 13, zone: 'MOUNTAIN PASS' },        // WP 14: Mountain Ridge S-Curve 1
    { pos: new THREE.Vector3(40, 18, -250), width: 13, zone: 'MOUNTAIN PASS' },         // WP 15: Ridge Apex
    { pos: new THREE.Vector3(10, 15, -290), width: 12, zone: 'MOUNTAIN PASS' },         // WP 16: Hairpin Entry
    { pos: new THREE.Vector3(-40, 12, -300), width: 12, zone: 'MOUNTAIN PASS' },        // WP 17: Hairpin Apex
    { pos: new THREE.Vector3(-90, 8, -260), width: 13, zone: 'MOUNTAIN PASS' },         // WP 18: Hairpin Exit Descent
    { pos: new THREE.Vector3(-140, 4, -200), width: 14, zone: 'MOUNTAIN PASS' },        // WP 19: Fast Downhill Sweeper

    // --- ZONE 4: INDUSTRIAL DISTRICT (Warehouses & Chicanes) ---
    { pos: new THREE.Vector3(-180, 0, -120), width: 15, zone: 'INDUSTRIAL DISTRICT' },  // WP 20: Industrial Depot
    { pos: new THREE.Vector3(-190, 0, -30), width: 15, zone: 'INDUSTRIAL DISTRICT' },   // WP 21: Crane Alley
    { pos: new THREE.Vector3(-160, 0, 50), width: 14, zone: 'INDUSTRIAL DISTRICT' },    // WP 22: Technical Chicane 1
    { pos: new THREE.Vector3(-180, 0, 110), width: 14, zone: 'INDUSTRIAL DISTRICT' },   // WP 23: Technical Chicane 2
    { pos: new THREE.Vector3(-140, 0, 160), width: 15, zone: 'INDUSTRIAL DISTRICT' },   // WP 24: Warehouse Exit
    { pos: new THREE.Vector3(-80, 0, 140), width: 16, zone: 'INDUSTRIAL DISTRICT' },    // WP 25: Harbor Curve
    { pos: new THREE.Vector3(-40, 0, 70), width: 17, zone: 'METRO CITY' },              // WP 26: Return to City Approach
    { pos: new THREE.Vector3(-15, 0, -30), width: 18, zone: 'METRO CITY' },             // WP 27: Final Corner onto Main Straight
  ];

  static getCurve(): THREE.CatmullRomCurve3 {
    const points = this.WAYPOINTS.map(w => w.pos);
    return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  }

  static getCheckpoints(): { index: number; position: THREE.Vector3; direction: THREE.Vector3; width: number; zone: string }[] {
    const curve = this.getCurve();
    const count = this.WAYPOINTS.length;
    const checkpoints = [];

    for (let i = 0; i < count; i++) {
      const u = i / count;
      const position = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const wp = this.WAYPOINTS[i];

      checkpoints.push({
        index: i,
        position,
        direction: tangent,
        width: wp.width,
        zone: wp.zone,
      });
    }

    return checkpoints;
  }
}
