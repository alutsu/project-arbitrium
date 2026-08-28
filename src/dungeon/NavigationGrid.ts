import type { GridCoordinate } from './GridCoordinate';
import type { RoomTemplate } from './RoomTemplate';

const FLOOR_GID = 1;

/**
 * The walkability grid baked from a room's terrain (GDD 6.1, step 2). Pathfinding works
 * against this rather than against a Tilemap, so navigation stays Phaser-free.
 */
export class NavigationGrid {
  private constructor(
    public readonly width: number,
    public readonly height: number,
    private readonly walkable: readonly boolean[],
  ) {}

  public static fromTiles(template: RoomTemplate, tiles: readonly number[]): NavigationGrid {
    return new NavigationGrid(
      template.widthInTiles,
      template.heightInTiles,
      tiles.map((gid) => gid === FLOOR_GID),
    );
  }

  /** Bakes from the template's own terrain, before any doors are sealed. */
  public static fromTemplate(template: RoomTemplate): NavigationGrid {
    return NavigationGrid.fromTiles(template, template.tiles);
  }

  public isWalkable(tile: GridCoordinate): boolean {
    if (!this.contains(tile)) {
      return false;
    }
    return this.walkable[tile.y * this.width + tile.x] === true;
  }

  public contains(tile: GridCoordinate): boolean {
    return tile.x >= 0 && tile.y >= 0 && tile.x < this.width && tile.y < this.height;
  }
}
