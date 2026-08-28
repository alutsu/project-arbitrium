import { degreesToRadians } from '../math/degreesToRadians';

const SINGLE = 1;
const HALF = 0.5;

/**
 * Firing angles for one shot (GDD 2.3.2, Barrel).
 *
 * A single projectile goes exactly where the player aims. Several fan out evenly across
 * `spreadDegrees`, centred on the aim, so a shotgun covers an arc without favouring one
 * side.
 */
export function spreadAngles(
  aimRadians: number,
  count: number,
  spreadDegrees: number,
): readonly number[] {
  if (count <= SINGLE) {
    return [aimRadians];
  }
  const spread = degreesToRadians(spreadDegrees);
  const step = spread / (count - SINGLE);
  const start = aimRadians - spread * HALF;
  return Array.from({ length: count }, (_unused, index) => start + step * index);
}
