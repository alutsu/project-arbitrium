import Phaser from 'phaser';
import type { RoomTemplate } from '../dungeon/RoomTemplate';
import { TERRAIN_GID } from '../dungeon/TerrainGid';

/** Tiled numbers its tiles from 1; a Phaser data tilemap indexes them from 0. */
const FIRST_GID = TERRAIN_GID.floor;
const WALL_INDEX = TERRAIN_GID.wall - FIRST_GID;
const TILESET_NAME = 'placeholder';

/**
 * Renders one room's terrain as a Phaser tilemap built from validated tile data
 * (GDD 3.2.1). The previous room's layer is freed on every change, since a roguelite
 * makes hundreds of these transitions (CLAUDE.md 5).
 */
export class RoomView {
  private layer: Phaser.Tilemaps.TilemapLayer | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilesetKey: string,
  ) {}

  /** Takes the room as it exists on the floor, from `sealedRoomOf`. */
  public show(template: RoomTemplate): Phaser.Tilemaps.TilemapLayer {
    this.destroy();
    const tiles = template.tiles;

    const rows: number[][] = [];
    for (let y = 0; y < template.heightInTiles; y++) {
      const start = y * template.widthInTiles;
      const row = tiles.slice(start, start + template.widthInTiles);
      rows.push(row.map((gid) => gid - FIRST_GID));
    }

    const map = this.scene.make.tilemap({
      data: rows,
      tileWidth: template.tileWidth,
      tileHeight: template.tileHeight,
    });
    const tileset = map.addTilesetImage(
      TILESET_NAME,
      this.tilesetKey,
      template.tileWidth,
      template.tileHeight,
    );
    if (tileset === null) {
      throw new Error(`Could not build a tileset for room "${template.id}"`);
    }

    const created = map.createLayer(0, tileset, 0, 0);
    // Arcade collision needs the CPU-side layer, so refuse a GPU layer loudly rather
    // than silently rendering a room the player can walk through.
    if (!(created instanceof Phaser.Tilemaps.TilemapLayer)) {
      throw new Error(`Room "${template.id}" did not produce a collidable tilemap layer`);
    }
    created.setCollision(WALL_INDEX);
    this.layer = created;
    return created;
  }

  public destroy(): void {
    this.layer?.destroy();
    this.layer = null;
  }
}
