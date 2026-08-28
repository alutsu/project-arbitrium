import type { Vector2 } from '../math/Vector2';

/** Something a weapon can hurt (CLAUDE.md 3.4). An enemy that cannot be hurt simply omits it. */
export interface Damageable {
  readonly position: Vector2;
  readonly isAlive: boolean;
  /** Applies damage, and a push away from `from` scaled by `knockback`. */
  takeHit(damage: number, knockback: number, from: Vector2): void;
}
