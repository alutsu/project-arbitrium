import type { Vector2 } from '../math/Vector2';
import type { Bargainable } from './Bargainable';

/**
 * Everything inside the Sphere of Influence, nearest first (GDD 2.2.1). All of them
 * show a Desire Icon; the first is the one a hold would settle with, so the player
 * chooses a target by moving rather than by cycling a selection.
 */
export function findWithinSphere(
  centre: Vector2,
  candidates: readonly Bargainable[],
  radiusPixels: number,
): readonly Bargainable[] {
  const radiusSquared = radiusPixels * radiusPixels;
  const withDistance: { readonly bargainable: Bargainable; readonly distanceSquared: number }[] =
    [];

  for (const candidate of candidates) {
    const dx = candidate.position.x - centre.x;
    const dy = candidate.position.y - centre.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared <= radiusSquared) {
      withDistance.push({ bargainable: candidate, distanceSquared });
    }
  }

  return withDistance
    .sort((left, right) => left.distanceSquared - right.distanceSquared)
    .map((entry) => entry.bargainable);
}
