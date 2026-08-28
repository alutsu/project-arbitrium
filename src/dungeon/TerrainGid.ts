interface TerrainGids {
  /** Walkable floor. */
  readonly floor: number;
  /** Solid wall. */
  readonly wall: number;
}

/**
 * The tile ids used by every room template, as Tiled numbers them (GDD 3.2.1.1).
 *
 * One definition, because rendering, analysis, navigation and projectile collision all
 * have to agree on which tile is a wall. They previously each carried their own copy.
 */
export const TERRAIN_GID: TerrainGids = { floor: 1, wall: 2 };
