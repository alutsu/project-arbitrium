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
import { FloorProgress } from '../dungeon/FloorProgress';
import { sealedRoomOf } from '../dungeon/sealedRoomOf';
import { resolveLiquidation, type LiquidationChoice } from '../liquidation/LiquidationService';
import type { WeaponData } from '../data/WeaponData';
import { WeaponSlot } from '../weapon/WeaponSlot';
import { PedestalView } from '../ui/PedestalView';
import { ForgeService, type ForgeOffer } from '../forge/ForgeService';
import { FORGE_ROOM_TAG } from '../dungeon/RoomTemplate';
import { ForgeView } from '../ui/ForgeView';
import { exitTowards, type RoomTemplate } from '../dungeon/RoomTemplate';
import { Enemy } from '../enemy/Enemy';
import { EncounterDirector } from '../encounter/EncounterDirector';
import { roomSeed } from '../encounter/roomSeed';
import { RoomAnalyzer } from '../dungeon/RoomAnalyzer';
import type { InputIntent } from '../input/InputIntent';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput';
import { ArcadePlayerActor } from '../player/ArcadePlayerActor';
import { PlayerController } from '../player/PlayerController';
import { PlayerMovement } from '../player/PlayerMovement';
import { PlayerResources } from '../player/PlayerResources';
import { PrideDebuff } from '../player/PrideDebuff';
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

const ENEMY_TEXTURE_SIZE = 26;
const ENEMY_RADIUS = ENEMY_TEXTURE_SIZE * CENTER_FACTOR;
/**
 * Placeholder art. A colour is picked from the sprite key so a new enemy in
 * `enemies.json` needs no code change to become visible.
 */
const ENEMY_COLOR_ROSE = 0xd1556b;
const ENEMY_COLOR_AMBER = 0xe0a458;
const ENEMY_COLOR_VIOLET = 0x9d7fd4;
const ENEMY_COLOR_AZURE = 0x5fa8d3;
const ENEMY_PLACEHOLDER_COLORS: readonly number[] = [
  ENEMY_COLOR_ROSE,
  ENEMY_COLOR_AMBER,
  ENEMY_COLOR_VIOLET,
  ENEMY_COLOR_AZURE,
];
const HASH_SEED = 7;
const HASH_MULTIPLIER = 31;

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
/** Below entities, so the player is not hidden by a pedestal they are standing on. */
const DEPTH_PEDESTAL = 5;
const DEPTH_ENTITIES = 10;
const DEPTH_PARLEY = 20;
const DEPTH_HUD = 30;

/** Salt so the weapon offered in a room draws from a different stream than its enemies. */
const WEAPON_STREAM_SALT = 0x5eed;
const NO_TIME = 0;
const NONE = 0;
/** Selections are 1-based on the keyboard, the shelf is 0-based. */
const CHOICE_OFFSET = 1;
const DAMAGE_DECIMALS = 1;

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
  private enemySprites: Phaser.GameObjects.Sprite[] = [];
  private readonly analyzer = new RoomAnalyzer();
  private director: EncounterDirector | null = null;
  private floorSeed = NO_TIME;
  private database: GameDatabase | null = null;
  private readonly progress = new FloorProgress();
  private weaponSlot: WeaponSlot | null = null;
  private offered: WeaponData | null = null;
  private pedestalView: PedestalView | null = null;
  private forgeService: ForgeService | null = null;
  private forgeView: ForgeView | null = null;
  private forgeNotice: string | null = null;
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
    this.load.json(DATA_KEYS.enemies, 'data/enemies.json');
    this.load.json(DATA_KEYS.encounter, 'data/encounter.json');
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
    this.floorSeed = database.dungeon.seed;
    this.database = database;
    this.weaponSlot = new WeaponSlot(database.startingWeapon());

    this.createTextures();
    this.playerSprite = this.createPlayerSprite();
    this.playerActor = new ArcadePlayerActor(this.playerSprite);
    this.inputSource = new KeyboardMouseInput(this.input, keyboard);
    this.playerController = new PlayerController(
      new PlayerMovement(database.playerStats),
      this.playerActor,
    );
    this.parleySystem = this.createParleySystem(database);
    this.director = new EncounterDirector({
      enemies: database.enemies,
      demands: database.bargain.demands,
      settings: database.encounter,
      rngFor: (seed) => new SeededRng(seed),
    });
    this.parleyView = new ParleyView(
      this,
      database.bargain.settings.sphereRadiusPixels,
      DEPTH_PARLEY,
    );
    this.roomView = new RoomView(this, TILESET_TEXTURE_KEY);
    this.forgeService = new ForgeService(database.upgrades);
    this.pedestalView = new PedestalView(this, DEPTH_PEDESTAL);
    this.forgeView = new ForgeView(this, DEPTH_PARLEY);
    this.hud = new ResourceHud(this, DEPTH_HUD);

    this.enterRoom(this.dungeon.start, null);

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
    controller.update(intent, { speedMultiplier: parley.state.pride.speedMultiplier });

    const frame = parley.update({
      isParleying: intent.isParleying,
      playerPosition: actor.position,
      deltaMs: delta,
      roomElapsedMs: this.roomElapsedMs,
    });

    this.parleyView?.render(frame, actor.position.x, actor.position.y);
    this.hud?.render(
      parley.state,
      room === null ? '' : roomLabel(room),
      this.weaponSlot === null ? '' : weaponLabelOf(this.weaponSlot),
    );

    if (room === null) {
      return;
    }
    this.settleClearance(room, parley.bargainableCount);
    if (isForgeRoom(room)) {
      this.pedestalView?.hide();
      this.offerForge(room, actor.position, intent);
    } else {
      this.forgeView?.hide();
      this.offerPedestal(room, actor.position, intent);
    }
    // Doors stay sealed until the room is cleared (GDD 2.1).
    if (this.progress.isCleared(room.coordinate)) {
      this.followExits(room, actor.position);
    }
  }

  /** A room is cleared once nothing in it is left to bargain with (GDD 2.1 phase 4). */
  private settleClearance(room: DungeonRoom, remaining: number): void {
    if (remaining > NONE || this.progress.isCleared(room.coordinate)) {
      return;
    }
    this.progress.markCleared(room.coordinate);
    this.offered = isForgeRoom(room) ? null : this.weaponOffered(room);
  }

  /**
   * Runs the Liquidation choice (GDD 2.3.1): E takes the offered weapon and drops the
   * one held, R dissolves the offer into gold.
   */
  private offerPedestal(room: DungeonRoom, playerAt: GridCoordinate, intent: InputIntent): void {
    const offered = this.offered;
    const slot = this.weaponSlot;
    const reach = this.database?.playerStats.interactReachPixels;
    if (offered === null || slot === null || reach === undefined) {
      this.pedestalView?.hide();
      return;
    }

    const at = this.pedestalPointFor(room);
    const withinReach = Math.hypot(at.x - playerAt.x, at.y - playerAt.y) <= reach;
    this.pedestalView?.show(offered, at, withinReach);
    if (!withinReach) {
      return;
    }

    const choice = liquidationChoiceOf(intent);
    if (choice === null) {
      return;
    }
    const parley = this.parleySystem;
    if (parley === null) {
      return;
    }
    const result = resolveLiquidation({
      choice,
      offered,
      slot,
      resources: parley.resources,
    });
    this.weaponSlot = result.slot;
    parley.replaceResources(result.resources);
    this.progress.markLiquidated(room.coordinate);
    this.offered = null;
    this.pedestalView?.hide();
  }

  /**
   * Runs the Forge (GDD 2.4): the shelf is filtered to Modules that fit the held weapon,
   * priced for the current floor, and a number key buys one.
   */
  private offerForge(room: DungeonRoom, playerAt: GridCoordinate, intent: InputIntent): void {
    const forge = this.forgeService;
    const slot = this.weaponSlot;
    const parley = this.parleySystem;
    const stats = this.database?.playerStats;
    const floor = this.database?.dungeon.floorNumber;
    if (forge === null || slot === null || parley === null || stats === undefined) {
      return;
    }
    if (floor === undefined) {
      return;
    }

    const at = this.pedestalPointFor(room);
    const withinReach =
      Math.hypot(at.x - playerAt.x, at.y - playerAt.y) <= stats.interactReachPixels;
    const stock = forge.stockFor(slot, floor);
    this.forgeView?.show(
      stock,
      { x: at.x, y: at.y, gold: parley.resources.gold, withinReach },
      this.forgeNotice,
    );

    if (!withinReach || intent.selection === null) {
      return;
    }
    this.buyModule(stock, intent.selection);
  }

  private buyModule(stock: readonly ForgeOffer[], selection: number): void {
    const forge = this.forgeService;
    const slot = this.weaponSlot;
    const parley = this.parleySystem;
    const offer = stock[selection - CHOICE_OFFSET];
    if (forge === null || slot === null || parley === null || offer === undefined) {
      return;
    }
    const receipt = forge.buy({ offer, slot, resources: parley.resources });
    if (!receipt.ok) {
      this.forgeNotice = receipt.error;
      return;
    }
    this.weaponSlot = receipt.value.slot;
    parley.replaceResources(receipt.value.resources);
    this.forgeNotice = null;
  }

  /**
   * The pedestal sits at the room's centre. GDD 6.1 step 5 says "at exit coordinates",
   * but a connector-based room has up to four exits, so there is no single exit to sit
   * at; the centre is reachable whichever door the player leaves by.
   */
  private pedestalPointFor(room: DungeonRoom): GridCoordinate {
    const { template } = room;
    return {
      x: template.widthInTiles * template.tileWidth * CENTER_FACTOR,
      y: template.heightInTiles * template.tileHeight * CENTER_FACTOR,
    };
  }

  /** The weapon this room offers, drawn from its own seeded stream (GDD 2.3.1). */
  private weaponOffered(room: DungeonRoom): WeaponData | null {
    const weapons = this.database?.weapons;
    if (weapons === undefined || weapons.length === NONE) {
      return null;
    }
    const rng = new SeededRng(roomSeed(this.floorSeed ^ WEAPON_STREAM_SALT, room.coordinate));
    return weapons[rng.nextInt(weapons.length)] ?? null;
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
      this.enterRoom(stepFrom(room.coordinate, direction), direction);
      return;
    }
  }

  private enterRoom(coordinate: GridCoordinate, travelled: Direction | null): void {
    const room = this.dungeon?.roomAt(coordinate);
    const view = this.roomView;
    const sprite = this.playerSprite;
    if (room === undefined || view === null || sprite === null) {
      return;
    }

    // Everything that reasons about this room's geometry uses the sealed version, so
    // rendering, analysis and spawning all agree on where the walls are.
    const sealed = sealedRoomOf(room);
    const layer = view.show(sealed);
    layer.setDepth(DEPTH_TERRAIN);
    this.wallCollider?.destroy();
    this.wallCollider = this.physics.add.collider(sprite, layer);
    this.currentRoom = room;
    // The Aggro Delay is measured from entering the room (GDD 4.1.1).
    this.roomElapsedMs = NO_TIME;
    // A Pride debuff ages by one room on entry (GDD 4.1.2).
    this.parleySystem?.onRoomEntry();

    const spawn = this.spawnPointFor(sealed, travelled);
    sprite.setPosition(spawn.x, spawn.y);
    sprite.setVelocity(0, 0);

    this.forgeNotice = null;
    if (this.progress.isCleared(room.coordinate)) {
      this.clearEnemySprites();
      this.offered =
        this.progress.isLiquidated(room.coordinate) || isForgeRoom(room)
          ? null
          : this.weaponOffered(room);
    } else {
      this.offered = null;
      this.repopulateRoom(room, sealed);
    }
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
   * Asks the Encounter Director what this room contains, then places it (GDD 3.2.2,
   * 3.2.3). The Director is seeded per room, so walking back in finds the same
   * encounter rather than a fresh roll.
   */
  private repopulateRoom(room: DungeonRoom, sealed: RoomTemplate): void {
    this.clearEnemySprites();

    const director = this.director;
    if (director === null) {
      return;
    }
    const plan = director.plan({
      room,
      analysis: this.analyzer.analyze(sealed),
      seed: roomSeed(this.floorSeed, room.coordinate),
    });

    for (const spawn of plan) {
      const textureKey = this.enemyTextureFor(spawn.enemy.spriteKey);
      const sprite = this.add.sprite(
        (spawn.tile.x + TILE_CENTRE) * sealed.tileWidth,
        (spawn.tile.y + TILE_CENTRE) * sealed.tileHeight,
        textureKey,
      );
      sprite.setDepth(DEPTH_ENTITIES);
      this.enemySprites.push(sprite);
      this.parleySystem?.add(new Enemy(sprite, spawn.enemy, spawn.demand));
    }
  }

  private clearEnemySprites(): void {
    for (const sprite of this.enemySprites) {
      sprite.destroy();
    }
    this.enemySprites = [];
    this.parleySystem?.clear();
  }

  /** Generates a placeholder texture per sprite key on first use. */
  private enemyTextureFor(spriteKey: string): string {
    if (this.textures.exists(spriteKey)) {
      return spriteKey;
    }
    let hash = HASH_SEED;
    for (const character of spriteKey) {
      hash = (Math.imul(hash, HASH_MULTIPLIER) + character.charCodeAt(0)) >>> 0;
    }
    const colour =
      ENEMY_PLACEHOLDER_COLORS[hash % ENEMY_PLACEHOLDER_COLORS.length] ??
      ENEMY_PLACEHOLDER_COLORS[0];
    const graphics = this.add.graphics();
    graphics.fillStyle(colour ?? 0).fillCircle(ENEMY_RADIUS, ENEMY_RADIUS, ENEMY_RADIUS);
    graphics.generateTexture(spriteKey, ENEMY_TEXTURE_SIZE, ENEMY_TEXTURE_SIZE);
    graphics.destroy();
    return spriteKey;
  }

  private createParleySystem(database: GameDatabase): ParleySystem {
    const { settings } = database.bargain;
    return new ParleySystem({
      session: new ParleySession(settings.holdDurationMs),
      service: new BargainService(settings),
      settings,
      state: {
        resources: new PlayerResources(
          database.playerStats.startingGold,
          database.playerStats.maxVitality,
        ),
        pride: PrideDebuff.none,
      },
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
    graphics.fillStyle(FLOOR_COLOR).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.fillStyle(WALL_COLOR).fillRect(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture(TILESET_TEXTURE_KEY, TILE_SIZE * TILESET_TILE_COUNT, TILE_SIZE);
    graphics.destroy();
  }

  private shutdownSystems(): void {
    this.inputSource?.destroy();
    this.parleyView?.destroy();
    this.pedestalView?.destroy();
    this.forgeView?.destroy();
    this.roomView?.destroy();
    this.hud?.destroy();
    this.wallCollider?.destroy();
    for (const grunt of this.enemySprites) {
      grunt.destroy();
    }
    this.enemySprites = [];
    this.inputSource = null;
    this.playerController = null;
    this.playerActor = null;
    this.playerSprite = null;
    this.parleySystem = null;
    this.parleyView = null;
    this.pedestalView = null;
    this.forgeView = null;
    this.forgeService = null;
    this.database = null;
    this.weaponSlot = null;
    this.offered = null;
    this.roomView = null;
    this.hud = null;
    this.dungeon = null;
    this.currentRoom = null;
    this.wallCollider = null;
  }
}

/** Damage is shown because fitting a Module changes it and nothing else visible. */
function weaponLabelOf(slot: WeaponSlot): string {
  const { weapon } = slot;
  return `Weapon ${weapon.name} (${weapon.damage.toFixed(DAMAGE_DECIMALS)} dmg)`;
}

function isForgeRoom(room: DungeonRoom): boolean {
  return room.template.tags.includes(FORGE_ROOM_TAG);
}

function liquidationChoiceOf(intent: InputIntent): LiquidationChoice | null {
  if (intent.isInteracting) {
    return 'Swap';
  }
  return intent.isSelling ? 'Sell' : null;
}

function roomLabel(room: DungeonRoom): string {
  return `Room ${coordinateKey(room.coordinate)} (${room.template.id})`;
}
