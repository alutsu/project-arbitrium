import Phaser from 'phaser';

const BOOT_MESSAGE = 'Project Arbitrium';
const BOOT_MESSAGE_STYLE = { fontFamily: 'monospace', fontSize: '20px', color: '#8a8a99' };
const CENTER_FACTOR = 0.5;

/**
 * Root gameplay scene. Scenes are wiring only (CLAUDE.md 3.1): from Sprint 1 they
 * construct systems and delegate to them, and never hold game rules of their own.
 */
export class GameScene extends Phaser.Scene {
  public static readonly KEY = 'GameScene';

  public constructor() {
    super({ key: GameScene.KEY });
  }

  public create(): void {
    const { width, height } = this.scale.gameSize;
    this.add
      .text(width * CENTER_FACTOR, height * CENTER_FACTOR, BOOT_MESSAGE, BOOT_MESSAGE_STYLE)
      .setOrigin(CENTER_FACTOR);
  }
}
