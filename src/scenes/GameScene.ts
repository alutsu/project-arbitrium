import Phaser from 'phaser';
import { BargainService } from '../bargain/BargainService';
import { ParleySession } from '../bargain/ParleySession';
import { ParleySystem } from '../bargain/ParleySystem';
import { GAME_DISPLAY } from '../config/gameDisplay';
import { DATA_KEYS } from '../data/dataKeys';
import type { GameDatabase } from '../data/GameDatabase';
import { loadGameData } from '../data/loadGameData';
import { PhaserJsonSource } from '../data/PhaserJsonSource';
import { Grunt } from '../enemy/Grunt';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput';
import { PlayerResources } from '../player/PlayerResources';
import { ArcadePlayerActor } from '../player/ArcadePlayerActor';
import { PlayerController } from '../player/PlayerController';
import { PlayerMovement } from '../player/PlayerMovement';
import { ParleyView } from '../ui/ParleyView';
import { ResourceHud } from '../ui/ResourceHud';

const CENTER_FACTOR = 0.5;

const PLAYER_TEXTURE_KEY = 'player-placeholder';
const PLAYER_TEXTURE_SIZE = 24;
const PLAYER_RADIUS = PLAYER_TEXTURE_SIZE * CENTER_FACTOR;
const PLAYER_BODY_COLOR = 0x6fd3c7;
const PLAYER_MUZZLE_COLOR = 0xf2f2f7;
const PLAYER_MUZZLE_LENGTH = 11;
const PLAYER_MUZZLE_THICKNESS = 4;

const GRUNT_TEXTURE_KEY = 'grunt-placeholder';
const GRUNT_TEXTURE_SIZE = 26;
const GRUNT_RADIUS = GRUNT_TEXTURE_SIZE * CENTER_FACTOR;
const GRUNT_COLOR = 0xd1556b;
const GRUNT_SPAWNS: readonly { readonly x: number; readonly y: number }[] = [
  { x: 340, y: 240 },
  { x: 940, y: 250 },
  { x: 640, y: 560 },
];

const NO_TIME = 0;

/**
 * Root gameplay scene. Wiring only (CLAUDE.md 3.1): it builds the systems, reads input
 * once per frame, ticks them, and holds no game rules of its own.
 */
export class GameScene extends Phaser.Scene {
  public static readonly KEY = 'GameScene';

  private inputSource: KeyboardMouseInput | null = null;
  private playerController: PlayerController | null = null;
  private playerActor: ArcadePlayerActor | null = null;
  private parleySystem: ParleySystem | null = null;
  private parleyView: ParleyView | null = null;
  private hud: ResourceHud | null = null;
  private roomElapsedMs = NO_TIME;

  public constructor() {
    super({ key: GameScene.KEY });
  }

  public preload(): void {
    this.load.json(DATA_KEYS.weapons, 'data/weapons.json');
    this.load.json(DATA_KEYS.upgrades, 'data/upgrades.json');
    this.load.json(DATA_KEYS.playerStats, 'data/player.json');
    this.load.json(DATA_KEYS.bargain, 'data/bargain.json');
  }

  public create(): void {
    // Invalid data is a programmer error, so fail loudly here rather than let an
    // undefined surface deep in a system later (CLAUDE.md 4.4).
    const gameData = loadGameData(new PhaserJsonSource(this.cache.json));
    if (!gameData.ok) {
      throw new Error(`Game data failed validation: ${gameData.error}`);
    }
    const database = gameData.value;

    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error('GameScene requires keyboard input; check the game config.');
    }

    this.createTextures();
    this.playerActor = new ArcadePlayerActor(this.createPlayerSprite());
    this.inputSource = new KeyboardMouseInput(this.input, keyboard);
    this.playerController = new PlayerController(
      new PlayerMovement(database.playerStats),
      this.playerActor,
    );

    this.parleySystem = this.createParleySystem(database);
    this.parleyView = new ParleyView(this, database.bargain.settings.sphereRadiusPixels);
    this.hud = new ResourceHud(this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shutdownSystems();
    });
  }

  public override update(_time: number, delta: number): void {
    const input = this.inputSource;
    const controller = this.playerController;
    const actor = this.playerActor;
    const parley = this.parleySystem;
    if (input === null || controller === null || actor === null || parley === null) {
      return;
    }

    this.roomElapsedMs += delta;

    // Read once per frame and share it: a second read would consume the edge-detected
    // one-shot actions.
    const intent = input.readIntent();
    controller.update(intent);

    const frame = parley.update({
      isParleying: intent.isParleying,
      playerPosition: actor.position,
      deltaMs: delta,
      roomElapsedMs: this.roomElapsedMs,
    });

    this.parleyView?.render(frame, actor.position.x, actor.position.y);
    this.hud?.render(parley.resources);
  }

  private createParleySystem(database: GameDatabase): ParleySystem {
    const { settings, demands } = database.bargain;
    const system = new ParleySystem({
      session: new ParleySession(settings.holdDurationMs),
      service: new BargainService(settings),
      settings,
      resources: new PlayerResources(
        database.playerStats.startingGold,
        database.playerStats.maxVitality,
      ),
    });

    // Fixed spawns with demands dealt round-robin. The Encounter Director places
    // enemies and picks their Desires from room context in Sprint 5 (GDD 3.2.2).
    GRUNT_SPAWNS.forEach((spawn, index) => {
      const demand = demands[index % demands.length];
      if (demand === undefined) {
        return;
      }
      const sprite = this.add.sprite(spawn.x, spawn.y, GRUNT_TEXTURE_KEY);
      system.add(new Grunt(sprite, demand));
    });

    return system;
  }

  private createPlayerSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    const sprite = this.physics.add.sprite(
      GAME_DISPLAY.width * CENTER_FACTOR,
      GAME_DISPLAY.height * CENTER_FACTOR,
      PLAYER_TEXTURE_KEY,
    );
    sprite.setCollideWorldBounds(true);
    return sprite;
  }

  /**
   * Placeholder art. The player carries a muzzle nub pointing along +x, which is
   * rotation zero in Phaser, so the sprite visibly reports where it is aiming.
   */
  private createTextures(): void {
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

    graphics.clear();
    graphics.fillStyle(GRUNT_COLOR).fillCircle(GRUNT_RADIUS, GRUNT_RADIUS, GRUNT_RADIUS);
    graphics.generateTexture(GRUNT_TEXTURE_KEY, GRUNT_TEXTURE_SIZE, GRUNT_TEXTURE_SIZE);
    graphics.destroy();
  }

  private shutdownSystems(): void {
    this.inputSource?.destroy();
    this.parleyView?.destroy();
    this.hud?.destroy();
    this.inputSource = null;
    this.playerController = null;
    this.playerActor = null;
    this.parleySystem = null;
    this.parleyView = null;
    this.hud = null;
  }
}
