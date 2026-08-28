import type { GridCoordinate } from './GridCoordinate';

/** The four sides a room can connect through (GDD 3.2.1). */
export type Direction = 'North' | 'South' | 'East' | 'West';

export const DIRECTIONS: readonly Direction[] = ['North', 'South', 'East', 'West'];

const OPPOSITES: Readonly<Record<Direction, Direction>> = {
  North: 'South',
  South: 'North',
  East: 'West',
  West: 'East',
};

const STEP = 1;
const OFFSETS: Readonly<Record<Direction, GridCoordinate>> = {
  North: { x: 0, y: -STEP },
  South: { x: 0, y: STEP },
  East: { x: STEP, y: 0 },
  West: { x: -STEP, y: 0 },
};

/** The side a neighbour must open on to meet this exit. */
export function oppositeOf(direction: Direction): Direction {
  return OPPOSITES[direction];
}

export function stepFrom(coordinate: GridCoordinate, direction: Direction): GridCoordinate {
  const offset = OFFSETS[direction];
  return { x: coordinate.x + offset.x, y: coordinate.y + offset.y };
}
