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
  public totalRacers = 8;

  public currentLapTime = 0;
  public bestLapTime: number | null = null;
  public totalRaceTime = 0;

  public countdownValue = 3;
  private countdownTimer = 1.0;

  // Checkpoints
  public currentCheckpointIndex = 0;
  public totalCheckpoints = 0;

  // Notifications
  public notifications: RaceNotification[] = [];

  // Race results
  public results: RaceResultEntry[] = [];

  private lastPlayerPos = 1;
  private playerSplineProgress = 0;

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
    this.results = [];
    audio.playCountdown(3);
  }

  update(
    delta: number,
    player: Vehicle,
    aiOpponents: AIOpponent[],
    track: BuiltTrack
  ) {
    // 1. Countdown update
    if (this.gameState === 'COUNTDOWN') {
      this.countdownTimer -= delta;
      if (this.countdownTimer <= 0) {
        this.countdownValue--;
        this.countdownTimer = 1.0;
        if (this.countdownValue > 0) {
          audio.playCountdown(this.countdownValue);
        } else if (this.countdownValue === 0) {
          audio.playCountdown(0); // GO!
          this.gameState = 'RACING';
          this.onStateChange?.('RACING');
          this.addNotification('GREEN FLAG!', 'RACE STARTED', '#00ff66');
        }
      }
      return;
    }

    if (this.gameState !== 'RACING') return;

    // 2. Race Time Accrual
    this.currentLapTime += delta;
    this.totalRaceTime += delta;

    // 3. Track Player Spline Progress
    const playerPos = player.physics.position;
    const curve = track.curve;

    // Calculate approximate spline progress U for player
    // Check against checkpoints to find closest segment
    let closestCpIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < track.checkpoints.length; i++) {
      const d = playerPos.distanceTo(track.checkpoints[i].position);
      if (d < minDist) {
        minDist = d;
        closestCpIdx = i;
      }
    }

    this.playerSplineProgress = closestCpIdx / track.checkpoints.length;
    this.totalCheckpoints = track.checkpoints.length;

    // Checkpoint crossing detection
    const totalCps = track.checkpoints.length;
    const nextExpectedCp = (this.currentCheckpointIndex + 1) % totalCps;
    const distToNext = playerPos.distanceTo(track.checkpoints[nextExpectedCp].position);

    // Reliable crossing detection: within 26m threshold or closest checkpoint advanced
    const hasReachedNext = distToNext < 26 || closestCpIdx === nextExpectedCp;

    if (hasReachedNext) {
      this.currentCheckpointIndex = nextExpectedCp;
      audio.playCheckpoint();

      // Check lap completion (crossing from final checkpoint to start/finish line)
      if (nextExpectedCp === 0) {
        this.onLapCompleted();
      } else {
        this.addNotification(`CHECKPOINT ${this.currentCheckpointIndex}`, '', '#33aaff');
      }
    }

    // 4. Calculate Live Standings / Position
    const playerTotalScore = (this.currentLap - 1) * 1.0 + this.playerSplineProgress;
    let rank = 1;

    aiOpponents.forEach(ai => {
      const aiScore = (ai.lap - 1) * 1.0 + ai.progressU;
      if (aiScore > playerTotalScore) {
        rank++;
      }
    });

    if (rank < this.lastPlayerPos) {
      this.addNotification('OVERTAKE!', `PASSED INTO P${rank}`, '#ffcc00');
    }
    this.lastPlayerPos = rank;
    this.playerPosition = rank;

    // Clean up notifications older than 2.8s
    const now = Date.now();
    this.notifications = this.notifications.filter(n => now - n.timestamp < 2800);
  }

  private onLapCompleted() {
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

    // Construct final leaderboard
    const entries: RaceResultEntry[] = [];
    entries.push({
      position: this.playerPosition,
      name: 'YOU (PLAYER)',
      carName: 'Apex GT-R',
      time: this.totalRaceTime,
      bestLap: this.bestLapTime || this.totalRaceTime / this.totalLaps,
      isPlayer: true,
      pointsAwarded: this.playerPosition === 1 ? 25 : this.playerPosition === 2 ? 18 : this.playerPosition === 3 ? 15 : 10,
    });

    // Populate placeholder AI entries
    const aiNames = ['Lucas Thorne', 'Elena Rostova', 'Kenji Sato', 'Marcus Vance', 'Sophia Sterling', 'Dante Ricci', 'Aria Chen'];
    aiNames.forEach((name, idx) => {
      const pos = idx + 1 >= this.playerPosition ? idx + 2 : idx + 1;
      const timeOffset = (pos - this.playerPosition) * 1.8 + Math.random() * 0.8;
      const totalTime = Math.max(10, this.totalRaceTime + timeOffset);
      entries.push({
        position: pos,
        name,
        carName: 'Rival Spec-V',
        time: totalTime,
        bestLap: totalTime / this.totalLaps * 0.95,
        isPlayer: false,
        pointsAwarded: pos === 1 ? 25 : pos === 2 ? 18 : pos === 3 ? 15 : Math.max(1, 12 - pos * 2),
      });
    });

    entries.sort((a, b) => a.position - b.position);
    this.results = entries;
  }

  addNotification(text: string, subtext = '', color = '#00f0ff') {
    this.notifications.push({
      id: Math.random().toString(),
      text,
      subtext,
      color,
      timestamp: Date.now(),
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
