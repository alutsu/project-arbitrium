import type { Direction } from './Direction';

/** Branded so a template id cannot be passed where another entity id is expected. */
export type RoomTemplateId = string & { readonly __brand: 'RoomTemplateId' };

/** Room shape, which the Encounter Director will spawn against in Sprint 5 (GDD 3.2.3). */
export type RoomTag = 'Arena' | 'Corridor';

export const ROOM_TAGS: readonly RoomTag[] = ['Arena', 'Corridor'];

/** A door out of the room, and the tile the player stands on when arriving through it. */
export interface RoomExit {
  readonly direction: Direction;
  readonly tileX: number;
  readonly tileY: number;
}

/**
 * A validated room layout, read from a Tiled map (GDD 3.2.1). Phaser-free: the
 * generator composes these into a dungeon without touching a Tilemap.
 */
export interface RoomTemplate {
  readonly id: RoomTemplateId;
  readonly widthInTiles: number;
  readonly heightInTiles: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  /** Row-major Tiled gids, one per tile: 1 is floor, 2 is wall. */
  readonly tiles: readonly number[];
  readonly exits: readonly RoomExit[];
  readonly tags: readonly RoomTag[];
}

export function hasExit(template: RoomTemplate, direction: Direction): boolean {
  return template.exits.some((exit) => exit.direction === direction);
}

export function exitTowards(template: RoomTemplate, direction: Direction): RoomExit | undefined {
  return template.exits.find((exit) => exit.direction === direction);
}
