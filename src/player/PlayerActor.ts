import type { Vector2 } from '../math/Vector2';

/**
 * What the player controller needs from whatever renders and moves the player
 * (CLAUDE.md 3.4). Keeping this narrow is what lets the controller stay Phaser-free.
 */
export interface PlayerActor {
  readonly position: Vector2;
  /** Moves the player by a displacement in pixels, already scaled by the frame delta. */
  moveBy(displacement: Vector2): void;
  setFacing(radians: number): void;
}
