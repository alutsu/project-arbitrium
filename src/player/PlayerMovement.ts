import type { PlayerStats } from '../config/playerStats';
import type { Vector2 } from '../math/Vector2';

/** The slice of `InputIntent` that movement depends on (CLAUDE.md 3.4). */
export interface MovementIntent {
  readonly moveAxes: Vector2;
  readonly isParleying: boolean;
}

const STOPPED: Vector2 = { x: 0, y: 0 };
const MAX_AXIS_MAGNITUDE = 1;
const FULL_SPEED_FACTOR = 1;

/**
 * Pure movement rules: axis input becomes a velocity. Phaser-free by design so the
 * rules are unit-testable (CLAUDE.md 3.5).
 */
export class PlayerMovement {
  public constructor(private readonly stats: PlayerStats) {}

  /**
   * Returns velocity in pixels per second. Deliberately NOT delta-scaled: Arcade
   * Physics integrates velocity against the frame delta itself, so scaling here
   * would apply the delta twice.
   */
  public resolveVelocity(intent: MovementIntent): Vector2 {
    const magnitude = Math.hypot(intent.moveAxes.x, intent.moveAxes.y);
    if (magnitude === 0) {
      return STOPPED;
    }

    const speed = this.currentSpeed(intent.isParleying);
    // Clamping rather than always normalizing keeps a diagonal from outrunning a
    // cardinal, while still letting a partial analog tilt move at partial speed.
    const clamp =
      magnitude > MAX_AXIS_MAGNITUDE ? MAX_AXIS_MAGNITUDE / magnitude : FULL_SPEED_FACTOR;

    return {
      x: intent.moveAxes.x * clamp * speed,
      y: intent.moveAxes.y * clamp * speed,
    };
  }

  private currentSpeed(isParleying: boolean): number {
    if (!isParleying) {
      return this.stats.moveSpeedPixelsPerSecond;
    }
    return (
      this.stats.moveSpeedPixelsPerSecond * (FULL_SPEED_FACTOR - this.stats.parleyMovementPenalty)
    );
  }
}
