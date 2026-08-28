import Phaser from 'phaser';
import { GAME_DISPLAY } from './config/gameDisplay';
import { GameScene } from './scenes/GameScene';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_DISPLAY.parentElementId,
  width: GAME_DISPLAY.width,
  height: GAME_DISPLAY.height,
  backgroundColor: GAME_DISPLAY.backgroundColor,
  // Crisp nearest-neighbour textures without pixelArt's roundPixels, which snaps
  // rendered positions to whole pixels and turns smooth sub-pixel travel into an
  // uneven 2px/3px shuffle whenever the player moves.
  antialias: false,
  antialiasGL: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Top-down game: Arcade physics with no gravity on either axis (GDD 7, Sprint 1).
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      // Step once per rendered frame rather than on a 60Hz accumulator. On a
      // high-refresh display the accumulator only steps on some frames, which
      // shows up as uneven motion; stepping per frame keeps travel smooth at
      // the display's refresh rate and stays delta-correct.
      fixedStep: false,
    },
  },
  scene: [GameScene],
};

function startGame(): Phaser.Game {
  return new Phaser.Game(GAME_CONFIG);
}

startGame();
