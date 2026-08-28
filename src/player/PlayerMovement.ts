import type { PlayerStats } from '../config/playerStats';
import type { Vector2 } from '../math/Vector2';

/** The slice of `InputIntent` that movement depends on (CLAUDE.md 3.4). */
export interface MovementIntent {
  readonly moveAxes: Vector2;
  readonly isParleying: boolean;
}

const STOPPED: Vector2 = { x: 0, y: 0 };
const MILLISECONDS_PER_SECOND = 1000;
const FULL_SPEED_FACTOR = 1;

/**
 * Pure movement rules: axis input becomes the distance to travel this frame.
 * Phaser-free by design so the rules are unit-testable (CLAUDE.md 3.5).
 */
export class PlayerMovement {
  public constructor(private readonly stats: PlayerStats) {}

  /**
   * Returns the displacement to apply this frame, in pixels, scaled by the frame
   * delta so travel speed is frame-rate independent (CLAUDE.md 5).
   *
   * @param deltaMs - Milliseconds elapsed since the previous frame.
   */
  public resolveDisplacement(intent: MovementIntent, deltaMs: number): Vector2 {
    const magnitude = Math.hypot(intent.moveAxes.x, intent.moveAxes.y);
    if (magnitude === 0) {
      return STOPPED;
    }

    const speed = this.currentSpeed(intent.isParleying);
    const deltaSeconds = deltaMs / MILLISECONDS_PER_SECOND;
    // Dividing by the magnitude normalizes the input to unit length, so a diagonal
    // travels exactly as far as a cardinal rather than sqrt(2) times as far.
    const step = (speed * deltaSeconds) / magnitude;

    return {
      x: intent.moveAxes.x * step,
      y: intent.moveAxes.y * step,
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
