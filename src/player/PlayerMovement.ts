import type { Vector2 } from '../math/Vector2';

/**
 * The slice of `PlayerStats` that movement depends on. Narrow on purpose: movement
 * has no business knowing about gold or vitality (CLAUDE.md 3.4).
 */
export interface MovementStats {
  readonly moveSpeedPixelsPerSecond: number;
  readonly parleyMovementPenalty: number;
}

/** The slice of `InputIntent` that movement depends on (CLAUDE.md 3.4). */
export interface MovementIntent {
  readonly moveAxes: Vector2;
  readonly isParleying: boolean;
}

const STOPPED: Vector2 = { x: 0, y: 0 };
const FULL_SPEED_FACTOR = 1;

/**
 * Pure movement rules: axis input becomes a velocity. Phaser-free by design so the
 * rules are unit-testable (CLAUDE.md 3.5).
 */
export class PlayerMovement {
  public constructor(private readonly stats: MovementStats) {}

  /**
   * Returns velocity in pixels per second.
   *
   * Do not multiply this by the frame delta. Arcade integrates velocity against the
   * delta itself (`Body.update`), which is what makes travel frame-rate independent
   * (CLAUDE.md 5). Applying a per-frame displacement here instead is what caused the
   * lumpy movement on high-refresh displays: the physics step runs on an accumulator
   * ahead of `scene.update`, so several frames of displacement land in one step.
   */
  public resolveVelocity(intent: MovementIntent): Vector2 {
    const magnitude = Math.hypot(intent.moveAxes.x, intent.moveAxes.y);
    if (magnitude === 0) {
      return STOPPED;
    }

    // Dividing by the magnitude normalizes the input to unit length, so a diagonal
    // travels exactly as fast as a cardinal rather than sqrt(2) times as fast.
    const speed = this.currentSpeed(intent.isParleying) / magnitude;

    return {
      x: intent.moveAxes.x * speed,
      y: intent.moveAxes.y * speed,
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
