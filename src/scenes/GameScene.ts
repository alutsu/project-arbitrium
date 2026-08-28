import Phaser from 'phaser';
import { GAME_DISPLAY } from '../config/gameDisplay';
import { DATA_KEYS } from '../data/dataKeys';
import { loadGameData } from '../data/loadGameData';
import { PhaserJsonSource } from '../data/PhaserJsonSource';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput';
import { ArcadePlayerActor } from '../player/ArcadePlayerActor';
import { PlayerController } from '../player/PlayerController';
import { PlayerMovement } from '../player/PlayerMovement';

const CENTER_FACTOR = 0.5;

const PLAYER_TEXTURE_KEY = 'player-placeholder';
const PLAYER_TEXTURE_SIZE = 24;
const PLAYER_RADIUS = PLAYER_TEXTURE_SIZE * CENTER_FACTOR;
const PLAYER_BODY_COLOR = 0x6fd3c7;
const PLAYER_MUZZLE_COLOR = 0xf2f2f7;
const PLAYER_MUZZLE_LENGTH = 11;
const PLAYER_MUZZLE_THICKNESS = 4;

/**
 * Root gameplay scene. Wiring only (CLAUDE.md 3.1): it builds the player systems and
 * ticks them, and holds no game rules of its own.
 */
export class GameScene extends Phaser.Scene {
  public static readonly KEY = 'GameScene';

  private playerController: PlayerController | null = null;

  public constructor() {
    super({ key: GameScene.KEY });
  }

  public preload(): void {
    this.load.json(DATA_KEYS.weapons, 'data/weapons.json');
    this.load.json(DATA_KEYS.upgrades, 'data/upgrades.json');
    this.load.json(DATA_KEYS.playerStats, 'data/player.json');
  }

  public create(): void {
    // Invalid data is a programmer error, so fail loudly here rather than let an
    // undefined surface deep in a system later (CLAUDE.md 4.4).
    const gameData = loadGameData(new PhaserJsonSource(this.cache.json));
    if (!gameData.ok) {
      throw new Error(`Game data failed validation: ${gameData.error}`);
    }

    this.createPlayerTexture();

    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('GameScene requires keyboard input; check the game config.');
    }

    const sprite = this.physics.add.sprite(
      GAME_DISPLAY.width * CENTER_FACTOR,
      GAME_DISPLAY.height * CENTER_FACTOR,
      PLAYER_TEXTURE_KEY,
    );
    sprite.setCollideWorldBounds(true);

    const input = new KeyboardMouseInput(this.input, keyboard);
    this.playerController = new PlayerController(
      input,
      new PlayerMovement(gameData.value.playerStats),
      new ArcadePlayerActor(sprite),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.destroy();
      this.playerController = null;
    });
  }

  public override update(): void {
    this.playerController?.update();
  }

  /**
   * Placeholder art: a body with a muzzle nub pointing along +x, which is rotation
   * zero in Phaser, so the sprite visibly reports where it is aiming.
   */
  private createPlayerTexture(): void {
    const graphics = this.add.graphics();
    graphics
      .fillStyle(PLAYER_BODY_COLOR)
      .fillCircle(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS)
      .fillStyle(PLAYER_MUZZLE_COLOR)
      .fillRect(
        PLAYER_RADIUS,
        PLAYER_RADIUS - PLAYER_MUZZLE_THICKNESS * CENTER_FACTOR,
        PLAYER_MUZZLE_LENGTH,
        PLAYER_MUZZLE_THICKNESS,
      );
    graphics.generateTexture(PLAYER_TEXTURE_KEY, PLAYER_TEXTURE_SIZE, PLAYER_TEXTURE_SIZE);
    graphics.destroy();
  }
}
