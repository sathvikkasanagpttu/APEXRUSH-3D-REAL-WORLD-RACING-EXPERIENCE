import * as THREE from 'three';
import { GameMode, GameState, RaceNotification, RaceResultEntry } from '../data/gameTypes';
import { Vehicle } from '../vehicles/Vehicle';
import { AIOpponent } from '../ai/AIOpponent';
import { BuiltTrack } from '../tracks/TrackBuilder';
import { audio } from '../audio/AudioEngine';

export class RaceManager {
  public gameState: GameState = 'MENU';
  public gameMode: GameMode = 'QUICK_RACE';
  public onStateChange?: (state: GameState) => void;

  public currentLap = 1;
  public totalLaps = 3;
  public playerPosition = 1;
  public totalRacers = 7;

  public currentLapTime = 0;
  public bestLapTime: number | null = null;
  public totalRaceTime = 0;

  public countdownValue = 3;
  private countdownTimer = 1.0;

  // Checkpoints
  public currentCheckpointIndex = 0;
  public totalCheckpoints = 28;
  private passedCheckpointsInLap = 0;

  // Notifications
  public notifications: RaceNotification[] = [];

  // Race results
  public results: RaceResultEntry[] = [];

  private lastPlayerPos = 1;

  constructor(totalLaps = 3, gameMode: GameMode = 'QUICK_RACE') {
    this.totalLaps = totalLaps;
    this.gameMode = gameMode;
  }

  startCountdown() {
    this.gameState = 'COUNTDOWN';
    this.onStateChange?.('COUNTDOWN');
    this.countdownValue = 3;
    this.countdownTimer = 1.0;
    this.currentLap = 1;
    this.currentLapTime = 0;
    this.totalRaceTime = 0;
    this.bestLapTime = null;
    this.currentCheckpointIndex = 0;
    this.passedCheckpointsInLap = 0;
    this.playerPosition = 1;
    this.lastPlayerPos = 1;
    this.notifications = [];
    this.results = [];
    audio.playCountdown(3);
  }

  update(
    delta: number,
    player: Vehicle,
    aiOpponents: AIOpponent[],
    track: BuiltTrack
  ) {
    const dt = Math.max(0.001, Math.min(delta, 0.05));

    // 1. Countdown update
    if (this.gameState === 'COUNTDOWN') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.countdownValue--;
        this.countdownTimer = 1.0;
        if (this.countdownValue > 0) {
          audio.playCountdown(this.countdownValue);
        } else if (this.countdownValue === 0) {
          audio.playCountdown(0); // GO!
          this.gameState = 'RACING';
          this.onStateChange?.('RACING');
          this.addNotification('GREEN FLAG!', 'RACE STARTED — PUSH FOR THE LEAD', '#00ff66');
        }
      }
      return;
    }

    if (this.gameState !== 'RACING') return;

    // 2. Race Time Accrual
    this.currentLapTime += dt;
    this.totalRaceTime += dt;

    // 3. Track Checkpoint Progression
    const playerPos = player.physics.position;
    const totalCps = track.checkpoints.length;
    this.totalCheckpoints = totalCps;

    const nextExpectedCp = (this.currentCheckpointIndex + 1) % totalCps;
    const nextCp = track.checkpoints[nextExpectedCp];
    const currentCp = track.checkpoints[this.currentCheckpointIndex];

    const distToNext = playerPos.distanceTo(nextCp.position);
    const toNextVec = playerPos.clone().sub(nextCp.position);
    // Check if player has crossed into checkpoint zone and is oriented along direction
    const passedPlane = toNextVec.dot(nextCp.direction) >= -8.0;
    const inRange = distToNext < Math.max(22, nextCp.width * 1.3);

    if (inRange && passedPlane) {
      // Advance checkpoint
      this.currentCheckpointIndex = nextExpectedCp;
      this.passedCheckpointsInLap++;

      // Check lap completion (checkpoint wrapped to 0)
      if (nextExpectedCp === 0) {
        // Prevent reverse lap / shortcut cheating: require passing at least 70% of checkpoints
        if (this.passedCheckpointsInLap >= Math.floor(totalCps * 0.7)) {
          audio.playCheckpoint();
          this.onLapCompleted();
        }
      } else {
        audio.playCheckpoint();
        this.addNotification(`SECTOR ${this.currentCheckpointIndex}`, currentCp.zone, '#33aaff');
      }
    }

    // 4. Calculate Live Standings / Position (Req 14)
    // Score = (lap - 1) + (checkpointIndex / totalCheckpoints) + (progressTowardNextCheckpoint)
    const segDist = Math.max(1, currentCp.position.distanceTo(nextCp.position));
    const fracToNext = Math.max(0, Math.min(1, 1 - (distToNext / segDist)));
    const playerTotalScore = (this.currentLap - 1) + (this.currentCheckpointIndex + fracToNext) / totalCps;

    let rank = 1;
    aiOpponents.forEach(ai => {
      const aiScore = (ai.lap - 1) + ai.progressU;
      if (aiScore > playerTotalScore) {
        rank++;
      }
    });

    if (rank < this.lastPlayerPos) {
      this.addNotification('OVERTAKE!', `MOVED UP TO P${rank}`, '#ffcc00');
    }
    this.lastPlayerPos = rank;
    this.playerPosition = rank;

    // Clean up notifications older than 2.8s
    const now = Date.now();
    this.notifications = this.notifications.filter(n => now - n.timestamp < 2800);
  }

  private onLapCompleted() {
    this.passedCheckpointsInLap = 0;

    // Record lap time
    if (!this.bestLapTime || this.currentLapTime < this.bestLapTime) {
      this.bestLapTime = this.currentLapTime;
      this.addNotification('FASTEST LAP!', this.formatTime(this.bestLapTime), '#9933ff');
    } else {
      this.addNotification(`LAP ${this.currentLap} COMPLETED`, this.formatTime(this.currentLapTime), '#00ffcc');
    }

    this.currentLapTime = 0;

    if (this.currentLap < this.totalLaps) {
      this.currentLap++;
      if (this.currentLap === this.totalLaps) {
        this.addNotification('FINAL LAP!', 'PUSH FOR VICTORY', '#ff0055');
      }
    } else {
      // Race Finished!
      this.finishRace();
    }
  }

  finishRace() {
    this.gameState = 'FINISHED';
    this.onStateChange?.('FINISHED');
    audio.playFinish();

    // Construct final leaderboard (Req 29)
    const entries: RaceResultEntry[] = [];
    const playerPoints = this.playerPosition === 1 ? 25 : this.playerPosition === 2 ? 18 : this.playerPosition === 3 ? 15 : Math.max(2, 14 - this.playerPosition * 2);

    entries.push({
      position: this.playerPosition,
      name: 'YOU (PLAYER)',
      carName: 'Apex GT-R',
      time: this.totalRaceTime,
      bestLap: this.bestLapTime || this.totalRaceTime / this.totalLaps,
      isPlayer: true,
      pointsAwarded: playerPoints,
    });

    // Populate AI entries with realistic relative times
    const aiNames = ['Lucas Thorne', 'Elena Rostova', 'Kenji Sato', 'Marcus Vance', 'Sophia Sterling', 'Dante Ricci', 'Aria Chen'];
    aiNames.forEach((name, idx) => {
      const pos = idx + 1 >= this.playerPosition ? idx + 2 : idx + 1;
      const timeOffset = (pos - this.playerPosition) * 2.2 + (Math.random() * 0.6 - 0.3);
      const totalTime = Math.max(10, this.totalRaceTime + timeOffset);
      const pts = pos === 1 ? 25 : pos === 2 ? 18 : pos === 3 ? 15 : Math.max(1, 14 - pos * 2);

      entries.push({
        position: pos,
        name,
        carName: 'Rival Spec-V',
        time: totalTime,
        bestLap: (totalTime / this.totalLaps) * 0.96,
        isPlayer: false,
        pointsAwarded: pts,
      });
    });

    entries.sort((a, b) => a.position - b.position);
    this.results = entries;
  }

  addNotification(text: string, subtext = '', color = '#00f0ff') {
    this.notifications.push({
      id: `${Date.now()}_${Math.random()}`,
      text,
      subtext,
      color,
      timestamp: Date.now(),
    });
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00.000';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
