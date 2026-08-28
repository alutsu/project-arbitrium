import type { GridCoordinate } from '../dungeon/GridCoordinate';

/** Odd primes, the usual choice for mixing grid coordinates into a hash. */
const X_PRIME = 73856093;
const Y_PRIME = 19349663;

/**
 * A seed unique to one room on one floor, derived from the floor seed and the room's
 * slot. Deriving rather than sharing one stream means a room's population does not
 * depend on the order rooms were visited, so walking back into a room finds the
 * encounter it had before.
 */
export function roomSeed(floorSeed: number, coordinate: GridCoordinate): number {
  return (floorSeed ^ Math.imul(coordinate.x, X_PRIME) ^ Math.imul(coordinate.y, Y_PRIME)) >>> 0;
}
