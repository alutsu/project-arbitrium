import Phaser from 'phaser';
import { GAME_DISPLAY } from './config/gameDisplay';
import { GameScene } from './scenes/GameScene';

const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: GAME_DISPLAY.parentElementId,
  width: GAME_DISPLAY.width,
  height: GAME_DISPLAY.height,
  backgroundColor: GAME_DISPLAY.backgroundColor,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Top-down game: Arcade physics with no gravity on either axis (GDD 7, Sprint 1).
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } },
  },
  scene: [GameScene],
};

function startGame(): Phaser.Game {
  return new Phaser.Game(GAME_CONFIG);
}

startGame();
