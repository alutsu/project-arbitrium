import type { GridCoordinate } from './GridCoordinate';
import type { RoomExit } from './RoomTemplate';

/** How far to either side of the door's centre tile still counts as the doorway. */
const DOOR_HALF_SPAN = 1;

/**
 * Whether the player standing on `tile` has reached this exit.
 *
 * Deliberately a crossing test rather than an exact tile match: a fast player, or a
 * long frame, can step past the door tile in one update, and an equality check would
 * silently miss the transition. Walls block every other approach, so "at or beyond the
 * door, within its span" is unambiguous.
 */
export function isAtExit(tile: GridCoordinate, exit: RoomExit): boolean {
  switch (exit.direction) {
    case 'North':
      return tile.y <= exit.tileY && withinSpan(tile.x, exit.tileX);
    case 'South':
      return tile.y >= exit.tileY && withinSpan(tile.x, exit.tileX);
    case 'West':
      return tile.x <= exit.tileX && withinSpan(tile.y, exit.tileY);
    case 'East':
      return tile.x >= exit.tileX && withinSpan(tile.y, exit.tileY);
  }
}

function withinSpan(actual: number, centre: number): boolean {
  return Math.abs(actual - centre) <= DOOR_HALF_SPAN;
}
