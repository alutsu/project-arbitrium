import type { Vector2 } from '../math/Vector2';

/**
 * One frame of player intent, covering the six actions defined in GDD 3.3.
 *
 * Held actions stay true for as long as the control is down; one-shot actions are
 * true only on the frame the press is detected.
 */
export interface InputIntent {
  /** Movement axes, each in [-1, 1]. Deliberately un-normalized: PlayerMovement owns that. */
  readonly moveAxes: Vector2;
  /** World-space point the player is aiming at. */
  readonly aimPoint: Vector2;
  /** Held: Attack. */
  readonly isAttacking: boolean;
  /** Held: Bargain. Costs 30% movement speed while true (GDD 2.2.1). */
  readonly isParleying: boolean;
  /** One-shot: Interact / Swap (GDD 2.3.1). */
  readonly isInteracting: boolean;
  /** One-shot: Sell (GDD 2.3.1). */
  readonly isSelling: boolean;
}
