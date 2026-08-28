import type { Vector2 } from '../math/Vector2';
import type { BargainDemand } from './BargainDemand';

/**
 * An entity the player can Parley with (CLAUDE.md 3.4). Enemies that cannot be
 * bargained with, such as a boss, simply do not implement this.
 */
export interface Bargainable {
  readonly position: Vector2;
  readonly demand: BargainDemand;
  /**
   * Leaves the arena having been paid off. Distinct from dying: a bargained enemy
   * drops no loot and grants no XP (GDD 2.2.2).
   */
  flee(): void;
}
