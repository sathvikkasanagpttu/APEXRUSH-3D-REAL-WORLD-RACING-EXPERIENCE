import React, { useState, useEffect, useRef } from 'react';
import { RacingCanvas } from './components/RacingCanvas';
import { GameEngine } from './game/GameEngine';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { Garage } from './components/Garage';
import { TrackSelect } from './components/TrackSelect';
import { Championship } from './components/Championship';
import { HUD } from './components/HUD';
import { PauseMenu } from './components/PauseMenu';
import { RaceResults } from './components/RaceResults';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TouchControls } from './components/TouchControls';
import { CameraMode, GameMode, GameState, TrackConfig } from './data/gameTypes';
import { CHAMPIONSHIP_RACES, ChampionshipRace } from './data/championshipData';
import { audio } from './audio/AudioEngine';

export const App: React.FC = () => {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [gameMode, setGameMode] = useState<GameMode>('QUICK_RACE');
  const [currentTrackConfig, setCurrentTrackConfig] = useState<TrackConfig>(CHAMPIONSHIP_RACES[0]);

  // Career progression
  const [unlockedStage, setUnlockedStage] = useState(1);
  const [careerPoints, setCareerPoints] = useState(0);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('CHASE');

  // Telemetry stream from engine
  const [telemetry, setTelemetry] = useState({
    speedKmh: 0,
    rpm: 900,
    gear: 1,
    boost: 100,
    fuel: 100,
    damage: 0,
    lap: 1,
    totalLaps: 3,
    position: 1,
    totalRacers: 7,
    currentLapTime: '00:00.000',
    bestLapTime: '--:--.---',
    totalRaceTime: '00:00.000',
    countdown: 3,
    notifications: [] as { id: string; text: string; subtext?: string; color?: string }[],
    driftScore: 0,
    driftCombo: 1.0,
    isDrifting: false,
    zoneName: 'METRO CITY',
  });

  const handleEngineReady = (eng: GameEngine) => {
    setEngine(eng);

    // Sync callbacks
    eng.onTelemetryUpdate = data => {
      setTelemetry(data);
    };

    eng.onStateChange = newState => {
      setGameState(newState);
    };

    eng.input.onPause = () => {
      if (eng.raceManager.gameState === 'RACING') {
        eng.raceManager.gameState = 'PAUSED';
        setGameState('PAUSED');
      } else if (eng.raceManager.gameState === 'PAUSED') {
        eng.raceManager.gameState = 'RACING';
        setGameState('RACING');
      }
    };

    eng.input.onReset = () => {
      if (eng.raceManager.gameState === 'RACING' || eng.raceManager.gameState === 'COUNTDOWN') {
        const cp = eng.track.checkpoints[eng.raceManager.currentCheckpointIndex] || eng.track.checkpoints[0];
        const rotY = Math.atan2(cp.direction.x, cp.direction.z);
        const resetPos = cp.position.clone();
        resetPos.y += 0.05;
        eng.playerVehicle.reset(resetPos, rotY);
        eng.cameraSystem.snapToVehicle(eng.playerVehicle);
        eng.raceManager.addNotification('VEHICLE RESET', 'RETURNED TO TRACK', '#ffaa00');
      }
    };

    eng.input.onCameraToggle = () => {
      eng.cameraSystem.cycleMode();
      setCameraMode(eng.cameraSystem.mode);
    };
  };

  const startRaceWithConfig = (config: TrackConfig, mode: GameMode) => {
    if (!engine) return;
    setCurrentTrackConfig(config);
    setGameMode(mode);
    engine.startRace(config, mode);
    setGameState('COUNTDOWN');
  };

  const handleChampionshipRace = (race: ChampionshipRace) => {
    startRaceWithConfig(race, 'CHAMPIONSHIP');
  };

  const handleRaceFinishContinue = () => {
    if (gameMode === 'CHAMPIONSHIP') {
      const currentRace = CHAMPIONSHIP_RACES.find(r => r.id === currentTrackConfig.id);
      if (currentRace && currentRace.stage === unlockedStage && telemetry.position <= 3) {
        setUnlockedStage(prev => Math.min(5, prev + 1));
        setCareerPoints(prev => prev + currentRace.rewardPoints);
      }
      setGameState('CHAMPIONSHIP');
    } else {
      setGameState('TRACK_SELECT');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-chakra">
      {/* 3D WebGL Canvas always rendering */}
      <RacingCanvas onEngineReady={handleEngineReady} />

      {/* Screen States */}
      {gameState === 'LOADING' && (
        <LoadingScreen
          onStart={() => {
            setGameState('MENU');
            if (engine) engine.raceManager.gameState = 'MENU';
          }}
        />
      )}

      {gameState === 'MENU' && (
        <MainMenu
          onStartRace={() => startRaceWithConfig(CHAMPIONSHIP_RACES[0], 'QUICK_RACE')}
          onOpenGarage={() => {
            setGameState('GARAGE');
            if (engine) engine.raceManager.gameState = 'GARAGE';
          }}
          onOpenTrackSelect={() => setGameState('TRACK_SELECT')}
          onOpenChampionship={() => setGameState('CHAMPIONSHIP')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
        />
      )}

      {gameState === 'GARAGE' && engine && (
        <Garage
          customization={engine.customization}
          onUpdateCustomization={custom => engine.updateCustomization(custom)}
          onBack={() => {
            setGameState('MENU');
            engine.raceManager.gameState = 'MENU';
          }}
        />
      )}

      {gameState === 'TRACK_SELECT' && (
        <TrackSelect
          onStartTrack={(config, mode) => startRaceWithConfig(config, mode)}
          onBack={() => setGameState('MENU')}
        />
      )}

      {gameState === 'CHAMPIONSHIP' && (
        <Championship
          unlockedStage={unlockedStage}
          totalPoints={careerPoints}
          onStartRace={handleChampionshipRace}
          onBack={() => setGameState('MENU')}
        />
      )}

      {(gameState === 'COUNTDOWN' || gameState === 'RACING') && engine && (
        <>
          <HUD
            telemetry={telemetry}
            track={engine.track}
            player={engine.playerVehicle}
            aiOpponents={engine.aiOpponents}
            cameraMode={cameraMode}
            onCameraToggle={() => {
              engine.cameraSystem.cycleMode();
              setCameraMode(engine.cameraSystem.mode);
            }}
            onPause={() => {
              engine.raceManager.gameState = 'PAUSED';
              setGameState('PAUSED');
            }}
          />
          <TouchControls inputManager={engine.input} />
        </>
      )}

      {gameState === 'PAUSED' && engine && (
        <PauseMenu
          onResume={() => {
            engine.raceManager.gameState = 'RACING';
            setGameState('RACING');
          }}
          onRestart={() => startRaceWithConfig(currentTrackConfig, gameMode)}
          onOpenSettings={() => setShowSettings(true)}
          onQuitToMenu={() => {
            engine.raceManager.gameState = 'MENU';
            setGameState('MENU');
          }}
        />
      )}

      {gameState === 'FINISHED' && engine && (
        <RaceResults
          results={engine.raceManager.results}
          playerPosition={telemetry.position}
          onRestart={() => startRaceWithConfig(currentTrackConfig, gameMode)}
          onContinue={handleRaceFinishContinue}
          onQuitToMenu={() => {
            engine.raceManager.gameState = 'MENU';
            setGameState('MENU');
          }}
        />
      )}

      {/* Overlays / Modals */}
      {showSettings && engine && (
        <SettingsModal
          settings={engine.settings}
          onUpdateSettings={s => {
            engine.settings = s;
            engine.lightingSystem.dirLight.castShadow = s.shadows;
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
};
export default App;
