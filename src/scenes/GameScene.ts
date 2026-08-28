import Phaser from 'phaser';
import { BargainService } from '../bargain/BargainService';
import { ParleySession } from '../bargain/ParleySession';
import { ParleySystem } from '../bargain/ParleySystem';
import { SeededRng } from '../core/SeededRng';
import { GAME_DISPLAY } from '../config/gameDisplay';
import { DATA_KEYS, ROOM_TEMPLATE_IDS, roomCacheKey } from '../data/dataKeys';
import type { GameDatabase } from '../data/GameDatabase';
import { loadGameData } from '../data/loadGameData';
import { PhaserJsonSource } from '../data/PhaserJsonSource';
import type { Dungeon, DungeonRoom } from '../dungeon/Dungeon';
import { DungeonGenerator } from '../dungeon/DungeonGenerator';
import { oppositeOf, stepFrom, type Direction } from '../dungeon/Direction';
import { coordinateKey, type GridCoordinate } from '../dungeon/GridCoordinate';
import { isAtExit } from '../dungeon/isAtExit';
import { exitTowards, type RoomTemplate } from '../dungeon/RoomTemplate';
import { Grunt } from '../enemy/Grunt';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput';
import { ArcadePlayerActor } from '../player/ArcadePlayerActor';
import { PlayerController } from '../player/PlayerController';
import { PlayerMovement } from '../player/PlayerMovement';
import { PlayerResources } from '../player/PlayerResources';
import { ParleyView } from '../ui/ParleyView';
import { ResourceHud } from '../ui/ResourceHud';
import { RoomView } from '../ui/RoomView';

const CENTER_FACTOR = 0.5;
const TILE_CENTRE = 0.5;
/** Tiles to stand clear of the door on arrival, so the player does not bounce back. */
const ARRIVAL_CLEARANCE = 2;

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
const GRUNT_SPAWNS: readonly GridCoordinate[] = [
  { x: 340, y: 240 },
  { x: 940, y: 250 },
  { x: 640, y: 560 },
];

const TILESET_TEXTURE_KEY = 'terrain-placeholder';
const TILE_SIZE = 40;
const FLOOR_COLOR = 0x16161d;
const WALL_COLOR = 0x39394a;
const TILESET_TILE_COUNT = 2;

/**
 * Draw order. Rooms are rebuilt on every transition, so the terrain layer is created
 * after the player and the HUD; without explicit depths it would cover them.
 */
const DEPTH_TERRAIN = 0;
const DEPTH_ENTITIES = 10;
const DEPTH_PARLEY = 20;
const DEPTH_HUD = 30;

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
  private playerSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
  private parleySystem: ParleySystem | null = null;
  private parleyView: ParleyView | null = null;
  private roomView: RoomView | null = null;
  private hud: ResourceHud | null = null;
  private dungeon: Dungeon | null = null;
  private currentRoom: DungeonRoom | null = null;
  private wallCollider: Phaser.Physics.Arcade.Collider | null = null;
  private grunts: Phaser.GameObjects.Sprite[] = [];
  private roomElapsedMs = NO_TIME;

  public constructor() {
    super({ key: GameScene.KEY });
  }

  public preload(): void {
    this.load.json(DATA_KEYS.weapons, 'data/weapons.json');
    this.load.json(DATA_KEYS.upgrades, 'data/upgrades.json');
    this.load.json(DATA_KEYS.playerStats, 'data/player.json');
    this.load.json(DATA_KEYS.bargain, 'data/bargain.json');
    this.load.json(DATA_KEYS.dungeon, 'data/dungeon.json');
    for (const id of ROOM_TEMPLATE_IDS) {
      this.load.json(roomCacheKey(id), `data/rooms/${id}.json`);
    }
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

    const floor = new DungeonGenerator({
      templates: database.roomTemplates,
      rng: new SeededRng(database.dungeon.seed),
      roomCount: database.dungeon.roomsPerFloor,
    }).generate();
    if (!floor.ok) {
      throw new Error(`Dungeon generation failed: ${floor.error}`);
    }
    this.dungeon = floor.value;

    this.createTextures();
    this.playerSprite = this.createPlayerSprite();
    this.playerActor = new ArcadePlayerActor(this.playerSprite);
    this.inputSource = new KeyboardMouseInput(this.input, keyboard);
    this.playerController = new PlayerController(
      new PlayerMovement(database.playerStats),
      this.playerActor,
    );
    this.parleySystem = this.createParleySystem(database);
    this.parleyView = new ParleyView(
      this,
      database.bargain.settings.sphereRadiusPixels,
      DEPTH_PARLEY,
    );
    this.roomView = new RoomView(this, TILESET_TEXTURE_KEY);
    this.hud = new ResourceHud(this, DEPTH_HUD);

    this.enterRoom(this.dungeon.start, null, database);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shutdownSystems();
    });
  }

  public override update(_time: number, delta: number): void {
    const input = this.inputSource;
    const controller = this.playerController;
    const actor = this.playerActor;
    const parley = this.parleySystem;
    const room = this.currentRoom;
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
    this.hud?.render(parley.resources, room === null ? '' : roomLabel(room));

    if (room !== null) {
      this.followExits(room, actor.position);
    }
  }

  /** Steps to the next room when the player stands on a door that leads somewhere. */
  private followExits(room: DungeonRoom, position: GridCoordinate): void {
    const { template } = room;
    const tileX = Math.floor(position.x / template.tileWidth);
    const tileY = Math.floor(position.y / template.tileHeight);

    for (const direction of room.connections) {
      const exit = exitTowards(template, direction);
      if (exit === undefined || !isAtExit({ x: tileX, y: tileY }, exit)) {
        continue;
      }
      this.enterRoom(stepFrom(room.coordinate, direction), direction, null);
      return;
    }
  }

  private enterRoom(
    coordinate: GridCoordinate,
    travelled: Direction | null,
    database: GameDatabase | null,
  ): void {
    const room = this.dungeon?.roomAt(coordinate);
    const view = this.roomView;
    const sprite = this.playerSprite;
    if (room === undefined || view === null || sprite === null) {
      return;
    }

    const layer = view.show(room.template, room.connections);
    layer.setDepth(DEPTH_TERRAIN);
    this.wallCollider?.destroy();
    this.wallCollider = this.physics.add.collider(sprite, layer);
    this.currentRoom = room;
    // The Aggro Delay is measured from entering the room (GDD 4.1.1).
    this.roomElapsedMs = NO_TIME;

    const spawn = this.spawnPointFor(room.template, travelled);
    sprite.setPosition(spawn.x, spawn.y);
    sprite.setVelocity(0, 0);

    this.repopulateRoom(room, database);
  }

  /** Centre of the room on arrival at the entrance, otherwise clear of the door used. */
  private spawnPointFor(template: RoomTemplate, travelled: Direction | null): GridCoordinate {
    if (travelled === null) {
      return {
        x: template.widthInTiles * template.tileWidth * CENTER_FACTOR,
        y: template.heightInTiles * template.tileHeight * CENTER_FACTOR,
      };
    }
    const arrival = exitTowards(template, oppositeOf(travelled));
    if (arrival === undefined) {
      return {
        x: template.widthInTiles * template.tileWidth * CENTER_FACTOR,
        y: template.heightInTiles * template.tileHeight * CENTER_FACTOR,
      };
    }
    let tile: GridCoordinate = { x: arrival.tileX, y: arrival.tileY };
    for (let step = 0; step < ARRIVAL_CLEARANCE; step++) {
      tile = stepFrom(tile, travelled);
    }
    return {
      x: (tile.x + TILE_CENTRE) * template.tileWidth,
      y: (tile.y + TILE_CENTRE) * template.tileHeight,
    };
  }

  /**
   * Fixed Grunts in the entrance only, so Parley still has something to negotiate with.
   * Per-room population is the Encounter Director's job in Sprint 5 (GDD 3.2.2).
   */
  private repopulateRoom(room: DungeonRoom, database: GameDatabase | null): void {
    for (const grunt of this.grunts) {
      grunt.destroy();
    }
    this.grunts = [];
    this.parleySystem?.clear();

    const demands = database?.bargain.demands;
    if (demands === undefined || coordinateKey(room.coordinate) !== coordinateKey({ x: 0, y: 0 })) {
      return;
    }
    GRUNT_SPAWNS.forEach((spawn, index) => {
      const demand = demands[index % demands.length];
      if (demand === undefined) {
        return;
      }
      const sprite = this.add.sprite(spawn.x, spawn.y, GRUNT_TEXTURE_KEY);
      sprite.setDepth(DEPTH_ENTITIES);
      this.grunts.push(sprite);
      this.parleySystem?.add(new Grunt(sprite, demand));
    });
  }

  private createParleySystem(database: GameDatabase): ParleySystem {
    const { settings } = database.bargain;
    return new ParleySystem({
      session: new ParleySession(settings.holdDurationMs),
      service: new BargainService(settings),
      settings,
      resources: new PlayerResources(
        database.playerStats.startingGold,
        database.playerStats.maxVitality,
      ),
    });
  }

  private createPlayerSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    const sprite = this.physics.add.sprite(
      GAME_DISPLAY.width * CENTER_FACTOR,
      GAME_DISPLAY.height * CENTER_FACTOR,
      PLAYER_TEXTURE_KEY,
    );
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(DEPTH_ENTITIES);
    return sprite;
  }

  /**
   * Placeholder art. The player carries a muzzle nub pointing along +x, which is
   * rotation zero in Phaser, so the sprite visibly reports where it is aiming. The
   * terrain texture is a two-tile strip: floor first, wall second.
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

    graphics.clear();
    graphics.fillStyle(FLOOR_COLOR).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(WALL_COLOR).fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture(TILESET_TEXTURE_KEY, TILE_SIZE * TILESET_TILE_COUNT, TILE_SIZE);
    graphics.destroy();
  }

  private shutdownSystems(): void {
    this.inputSource?.destroy();
    this.parleyView?.destroy();
    this.roomView?.destroy();
    this.hud?.destroy();
    this.wallCollider?.destroy();
    for (const grunt of this.grunts) {
      grunt.destroy();
    }
    this.grunts = [];
    this.inputSource = null;
    this.playerController = null;
    this.playerActor = null;
    this.playerSprite = null;
    this.parleySystem = null;
    this.parleyView = null;
    this.roomView = null;
    this.hud = null;
    this.dungeon = null;
    this.currentRoom = null;
    this.wallCollider = null;
  }
}

function roomLabel(room: DungeonRoom): string {
  return `Room ${coordinateKey(room.coordinate)} (${room.template.id})`;
}
