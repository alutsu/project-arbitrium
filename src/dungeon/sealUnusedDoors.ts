import type { Direction } from './Direction';
import type { GridCoordinate } from './GridCoordinate';
import type { RoomExit, RoomTemplate } from './RoomTemplate';

const WALL_GID = 2;
/** Matches the doorway width used by `isAtExit`. */
const DOOR_HALF_SPAN = 1;
const DOOR_SPAN = DOOR_HALF_SPAN + DOOR_HALF_SPAN + 1;

/**
 * Walls up every doorway that leads nowhere, so a template with four doors can be
 * placed in a dead end without leaving a gap the player can wedge themselves into.
 * This is GDD 2.1's "doors seal", applied to the sides generation never connected.
 */
export function sealUnusedDoors(
  template: RoomTemplate,
  connections: readonly Direction[],
): readonly number[] {
  const tiles = [...template.tiles];
  const unused = template.exits.filter((exit) => !connections.includes(exit.direction));

  for (const exit of unused) {
    for (const tile of doorwayTilesOf(template, exit)) {
      tiles[tile] = WALL_GID;
    }
  }
  return tiles;
}

const SPAN_OFFSETS: readonly number[] = Array.from(
  { length: DOOR_SPAN },
  (_unused, index) => index - DOOR_HALF_SPAN,
);

/** Indices of the border tiles this exit opens through. */
function doorwayTilesOf(template: RoomTemplate, exit: RoomExit): number[] {
  return SPAN_OFFSETS.map((offset) => borderTileFor(template, exit, offset))
    .filter((tile) => isInside(template, tile))
    .map((tile) => tile.y * template.widthInTiles + tile.x);
}

function borderTileFor(template: RoomTemplate, exit: RoomExit, offset: number): GridCoordinate {
  switch (exit.direction) {
    case 'North':
      return { x: exit.tileX + offset, y: 0 };
    case 'South':
      return { x: exit.tileX + offset, y: template.heightInTiles - 1 };
    case 'West':
      return { x: 0, y: exit.tileY + offset };
    case 'East':
      return { x: template.widthInTiles - 1, y: exit.tileY + offset };
  }
}

function isInside(template: RoomTemplate, tile: GridCoordinate): boolean {
  return (
    tile.x >= 0 && tile.x < template.widthInTiles && tile.y >= 0 && tile.y < template.heightInTiles
  );
}
