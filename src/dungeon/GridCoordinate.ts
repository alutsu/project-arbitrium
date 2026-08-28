/** A room's slot on the dungeon grid, not a pixel position. */
export interface GridCoordinate {
  readonly x: number;
  readonly y: number;
}

/** A stable map key, since coordinates are compared by value rather than identity. */
export function coordinateKey(coordinate: GridCoordinate): string {
  return `${String(coordinate.x)},${String(coordinate.y)}`;
}
