/** How active effects are currently altering the player, read by movement each frame. */
export interface PlayerCondition {
  /** Multiplier on movement speed; 1 when nothing is slowing the player down. */
  readonly speedMultiplier: number;
}

const FULL_SPEED = 1;

/** Nothing is affecting the player. */
export const UNAFFECTED: PlayerCondition = { speedMultiplier: FULL_SPEED };
