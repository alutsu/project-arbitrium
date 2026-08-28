import type { Vector2 } from './Vector2';

/** The heading from one point to another, in radians, measured from +x as Phaser does. */
export function angleBetween(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}
