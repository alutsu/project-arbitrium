import { coordinateKey, type GridCoordinate } from './GridCoordinate';
import type { RoomTemplate } from './RoomTemplate';
import type { TileKind } from './TileKind';

const FLOOR_GID = 1;
const COVER_WALLS = 1;

/** Where every walkable tile in a room sits, grouped so spawning can query by kind. */
export interface RoomAnalysis {
  readonly walkable: readonly GridCoordinate[];
  kindAt(tile: GridCoordinate): TileKind | undefined;
  tilesOf(kind: TileKind): readonly GridCoordinate[];
}

/**
 * Classifies a room's floor (GDD 3.2.2).
 *
 * The rule, in words: a tile with walls on two perpendicular sides is a `Corner`, one
 * with any other adjacent wall is `Cover`, and one standing free of walls is `Open`.
 * Corner beats Cover because a corner is the stronger tactical feature — it is where a
 * stationary enemy wants to sit and cover the room.
 *
 * Phaser-free, so room analysis is unit-testable (CLAUDE.md 3.5).
 */
export class RoomAnalyzer {
  public analyze(template: RoomTemplate): RoomAnalysis {
    const kinds = new Map<string, TileKind>();
    const walkable: GridCoordinate[] = [];
    const byKind = new Map<TileKind, GridCoordinate[]>();

    for (const tile of everyTileOf(template)) {
      if (!isFloor(template, tile)) {
        continue;
      }
      const kind = classify(template, tile);
      walkable.push(tile);
      kinds.set(coordinateKey(tile), kind);
      const bucket = byKind.get(kind) ?? [];
      bucket.push(tile);
      byKind.set(kind, bucket);
    }

    return {
      walkable,
      kindAt: (tile) => kinds.get(coordinateKey(tile)),
      tilesOf: (kind) => byKind.get(kind) ?? [],
    };
  }
}

function everyTileOf(template: RoomTemplate): GridCoordinate[] {
  const tiles: GridCoordinate[] = [];
  for (let y = 0; y < template.heightInTiles; y++) {
    for (let x = 0; x < template.widthInTiles; x++) {
      tiles.push({ x, y });
    }
  }
  return tiles;
}

function isFloor(template: RoomTemplate, tile: GridCoordinate): boolean {
  if (
    tile.x < 0 ||
    tile.y < 0 ||
    tile.x >= template.widthInTiles ||
    tile.y >= template.heightInTiles
  ) {
    return false;
  }
  return template.tiles[tile.y * template.widthInTiles + tile.x] === FLOOR_GID;
}

function classify(template: RoomTemplate, tile: GridCoordinate): TileKind {
  const north = !isFloor(template, { x: tile.x, y: tile.y - 1 });
  const south = !isFloor(template, { x: tile.x, y: tile.y + 1 });
  const west = !isFloor(template, { x: tile.x - 1, y: tile.y });
  const east = !isFloor(template, { x: tile.x + 1, y: tile.y });

  const perpendicular = (north || south) && (west || east);
  if (perpendicular) {
    return 'Corner';
  }
  const wallCount = [north, south, west, east].filter(Boolean).length;
  return wallCount >= COVER_WALLS ? 'Cover' : 'Open';
}
